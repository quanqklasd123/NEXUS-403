// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer; // Thêm
using Microsoft.AspNetCore.Identity; // Thêm
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens; // Thêm
using Microsoft.OpenApi.Models;
using System.Text; // Thêm
using TodoApi.Data;
using TodoApi.Models;
using TodoApi.AI;

// --- ĐẶT TÊN POLICY Ở ĐÂY ĐỂ DÙNG LẠI ---
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration; // Lấy config

// === VỊ TRÍ 1: THÊM DỊCH VỤ CORS ===
// (Nên đặt trước AddControllers)
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Cho phép các nguồn gốc này
                          policy.WithOrigins("http://localhost:3000", // Cổng mặc định của React
                                           "http://localhost:5173", // Cổng mặc định của Vite
                                           "http://localhost:5174") // Cổng Vite khi 5173 bị chiếm
                                .AllowAnyHeader()   // Cho phép mọi header
                                .AllowAnyMethod()   // Cho phép mọi phương thức (GET, POST, PUT...)
                                .AllowCredentials(); // Cho phép gửi credentials (cookies, headers)
                      });
});
// ===================================

// 1. Thêm Services với JSON options để tự động map camelCase
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Cho phép tự động map giữa camelCase (frontend) và PascalCase (backend)
        // ASP.NET Core mặc định sẽ tự động map, nhưng cấu hình rõ ràng để đảm bảo
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 2. Cấu hình DbContext (Giữ nguyên)
var connectionString = configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TodoContext>(opt =>
    opt.UseSqlServer(connectionString));

// 3. Cấu hình AutoMapper (Giữ nguyên)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Đăng ký AiModelService để có thể "tiêm" nó vào Controller
builder.Services.AddSingleton<AiModelService>();

// --- BẮT ĐẦU CẤU HÌNH IDENTITY & JWT ---

// 4. Thêm Identity
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<TodoContext>()
    .AddDefaultTokenProviders();

// 5. Thêm Xác thực (Authentication) và cấu hình JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Tắt HTTPS (chỉ trong dev)
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = configuration["JwtConfig:Audience"],
        ValidIssuer = configuration["JwtConfig:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtConfig:Secret"]))
    };
});

builder.Services.AddSingleton<AiPredictionService>();

// --- KẾT THÚC CẤU HÌNH ---

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Thêm định nghĩa bảo mật (Security Definition) cho JWT
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field (ví dụ: Bearer {token})",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Yêu cầu tất cả các request phải gửi kèm token
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// ... (Cấu hình Swagger)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// === VỊ TRÍ 2: SỬ DỤNG MIDDLEWARE CORS ===
// (Rất quan trọng về thứ tự: Phải đặt SAU UseRouting (ẩn),
// và TRƯỚC UseAuthentication/UseAuthorization)

app.UseCors(MyAllowSpecificOrigins); // <-- THÊM DÒNG NÀY

// (QUAN TRỌNG: Phải nằm SAU UseCors và TRƯỚC MapControllers)
app.UseAuthentication(); // Bật "Xác thực"
app.UseAuthorization();  // Bật "Quyền"
// ========================================

await SeedRoles(app);

app.MapControllers();
app.Run();

async Task SeedRoles(WebApplication app)
{
    // 1. Tạo một "scope" (phạm vi) dịch vụ để lấy các service
    using (var scope = app.Services.CreateScope())
    {
        // 2. Lấy RoleManager từ service provider
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // 3. Danh sách các role bạn muốn tạo
        string[] roleNames = { "Admin", "User" };

        foreach (var roleName in roleNames)
        {
            // 4. Kiểm tra xem role đã tồn tại chưa
            var roleExists = await roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                // 5. Nếu chưa, tạo role mới
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }
}