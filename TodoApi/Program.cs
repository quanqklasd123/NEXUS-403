// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Linq;
using TodoApi.Data;
using TodoApi.Models;
using MongoDB.Driver;

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

// 2. Cấu hình MongoDB
var mongoConnectionString = configuration.GetConnectionString("MongoDbConnection");
var mongoDatabaseName = configuration.GetConnectionString("MongoDbDatabaseName") ?? "NexusDb";

if (string.IsNullOrEmpty(mongoConnectionString))
{
    throw new InvalidOperationException("MongoDbConnection string is not configured");
}

// Đảm bảo connection string có TLS options
if (!mongoConnectionString.Contains("tls=") && !mongoConnectionString.Contains("ssl="))
{
    // Thêm TLS options nếu chưa có
    var separator = mongoConnectionString.Contains("?") ? "&" : "?";
    mongoConnectionString = $"{mongoConnectionString}{separator}tls=true";
}

// Tạo MongoDB client settings với TLS
var mongoClientSettings = MongoDB.Driver.MongoClientSettings.FromConnectionString(mongoConnectionString);
mongoClientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
mongoClientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
mongoClientSettings.SocketTimeout = TimeSpan.FromSeconds(10);

// Tạo MongoDB client với error handling
try
{
    var mongoClient = new MongoDB.Driver.MongoClient(mongoClientSettings);
    builder.Services.AddSingleton<MongoDB.Driver.IMongoClient>(mongoClient);
    builder.Services.AddScoped<MongoDbContext>(sp =>
    {
        var client = sp.GetRequiredService<MongoDB.Driver.IMongoClient>();
        return new MongoDbContext(client, mongoDatabaseName);
    });
    
    // Test connection synchronously để catch lỗi sớm
    try
    {
        var testClient = new MongoDB.Driver.MongoClient(mongoClientSettings);
        var database = testClient.GetDatabase(mongoDatabaseName);
        var collections = await database.ListCollectionNamesAsync();
        await collections.FirstOrDefaultAsync();
        Console.WriteLine($"✓ MongoDB connected successfully to database: {mongoDatabaseName}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ MongoDB connection test error: {ex.Message}");
        Console.WriteLine($"  Connection string: {mongoConnectionString.Substring(0, Math.Min(50, mongoConnectionString.Length))}...");
        Console.WriteLine($"  Full error: {ex}");
        // Không throw để app vẫn có thể start, nhưng sẽ log lỗi
    }
}
catch (Exception ex)
{
    Console.WriteLine($"MongoDB client creation error: {ex.Message}");
    throw;
}

// 2b. Đã chuyển hoàn toàn sang MongoDB - không còn dùng SQL Server/TodoContext
// TodoContext đã được thay thế bằng MongoDbContext cho tất cả business data
// Identity cũng đã chuyển sang MongoDB với custom stores

// 3. Cấu hình AutoMapper (Giữ nguyên)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// AI và Google Calendar services đã được xóa để làm sạch dự án

// --- BẮT ĐẦU CẤU HÌNH IDENTITY & JWT ---

// 4. Thêm Identity với MongoDB (thay vì SQL Server)
builder.Services.AddIdentity<TodoApi.Models.MongoIdentity.AppUser, TodoApi.Models.MongoIdentity.IdentityRole>()
    .AddDefaultTokenProviders();

// Đăng ký custom MongoDB stores
builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IUserStore<TodoApi.Models.MongoIdentity.AppUser>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new TodoApi.Data.MongoIdentity.MongoUserStore(mongoContext.Database);
});

builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IRoleStore<TodoApi.Models.MongoIdentity.IdentityRole>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new TodoApi.Data.MongoIdentity.MongoRoleStore(mongoContext.Database);
});

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtConfig:Secret"])),
        // Cấu hình để đọc role claims từ token
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };
});

// 6. Thêm Authorization để hỗ trợ role-based access control
builder.Services.AddAuthorization(options =>
{
    // Sử dụng case-insensitive role matching - chỉ kiểm tra claims từ JWT token
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireAssertion(context => 
        {
            var roleClaims = context.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();
            
            // Kiểm tra case-insensitive
            return roleClaims.Any(role => 
                role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
                role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase));
        }));
    
    options.AddPolicy("UserOrAdmin", policy => 
        policy.RequireAssertion(context => 
        {
            var roleClaims = context.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();
            
            // Kiểm tra case-insensitive
            return roleClaims.Any(role => 
                role.Equals("User", StringComparison.OrdinalIgnoreCase) || 
                role.Equals("USER", StringComparison.OrdinalIgnoreCase) ||
                role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
                role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase));
        }));
});

// AiPredictionService đã được xóa

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
        // 2. Lấy RoleManager từ service provider (sử dụng custom IdentityRole cho MongoDB)
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<TodoApi.Models.MongoIdentity.IdentityRole>>();

        // 3. Danh sách các role bạn muốn tạo
        string[] roleNames = { "Admin", "User" };

        foreach (var roleName in roleNames)
        {
            // 4. Kiểm tra xem role đã tồn tại chưa
            var roleExists = await roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                // 5. Nếu chưa, tạo role mới
                var role = new TodoApi.Models.MongoIdentity.IdentityRole
                {
                    Name = roleName,
                    NormalizedName = roleName.ToUpper()
                };
                await roleManager.CreateAsync(role);
            }
        }
    }
}