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
using TodoApi.Middleware;
using MongoDB.Driver;

// --- ĐặT TÊN POLICY CORS Ở ĐÂY ĐỂ DÙNG LẠI ---
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration; // Lấy config

// === VỊ TRÍ 1: THÊM DỊCH VỤ CORS (Cross-Origin Resource Sharing) ===
// (Nên đặt trước khi gọi AddControllers)
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Cho phép các nguồn gốc (origins) sau đây truy cập API
                          policy.WithOrigins("http://localhost:3000", // Cổng mặc định của React
                                           "http://localhost:5173", // Cổng mặc định của Vite
                                           "http://localhost:5174") // Cổng Vite dự phòng khi 5173 bị chiếm
                                .AllowAnyHeader()   // Cho phép mọi loại header
                                .AllowAnyMethod()   // Cho phép mọi phương thức HTTP (GET, POST, PUT, DELETE...)
                                .AllowCredentials(); // Cho phép gửi thông tin xác thực (cookies, headers)
                      });
});
// ==========================================

// 1. Thêm dịch vụ Controllers với cấu hình JSON để tự động chuyển đổi camelCase (JavaScript) <-> PascalCase (C#)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Cho phép tự động mapping giữa camelCase (frontend) và PascalCase (backend)
        // ASP.NET Core mặc định đã tự động map, nhưng cấu hình rõ ràng để đảm bảo
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 2. Cấu hình kết nối MongoDB
var mongoConnectionString = configuration.GetConnectionString("MongoDbConnection");
var mongoDatabaseName = configuration.GetConnectionString("MongoDbDatabaseName") ?? "NexusDb";

if (string.IsNullOrEmpty(mongoConnectionString))
{
    throw new InvalidOperationException("MongoDbConnection string is not configured");
}

// Đảm bảo connection string có các tùy chọn TLS bảo mật
if (!mongoConnectionString.Contains("tls=") && !mongoConnectionString.Contains("ssl="))
{
    // Thêm các tùy chọn TLS nếu chưa có trong connection string
    var separator = mongoConnectionString.Contains("?") ? "&" : "?";
    mongoConnectionString = $"{mongoConnectionString}{separator}tls=true";
}

// Tạo các thiết lập (settings) cho MongoDB client với TLS được bật
var mongoClientSettings = MongoDB.Driver.MongoClientSettings.FromConnectionString(mongoConnectionString);
mongoClientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
mongoClientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
mongoClientSettings.SocketTimeout = TimeSpan.FromSeconds(10);

// Tạo MongoDB client với xử lý lỗi (error handling)
try
{
    var mongoClient = new MongoDB.Driver.MongoClient(mongoClientSettings);
    builder.Services.AddSingleton<MongoDB.Driver.IMongoClient>(mongoClient);
    builder.Services.AddScoped<MongoDbContext>(sp =>
    {
        var client = sp.GetRequiredService<MongoDB.Driver.IMongoClient>();
        return new MongoDbContext(client, mongoDatabaseName);
    });

    // Register AppDbContext for multi-tenant support
    builder.Services.AddScoped<AppDbContext>(sp =>
    {
        var mongoClient = sp.GetRequiredService<MongoDB.Driver.IMongoClient>();
        var mongoContext = sp.GetRequiredService<MongoDbContext>();
        var logger = sp.GetService<ILogger<AppDbContext>>();
        return new AppDbContext(mongoClient, mongoContext, logger);
    });
    
    // Kiểm tra kết nối đồng bộ (synchronously) để bắt lỗi sớm
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

// 2b. Đã chuyển hoàn toàn sang MongoDB - không còn sử dụng SQL Server/TodoContext nữa
// TodoContext đã được thay thế bằng MongoDbContext cho tất cả dữ liệu kinh doanh (business data)
// Hệ thống Identity cũng đã chuyển sang MongoDB với các custom stores

// 3. Cấu hình AutoMapper (thư viện tự động chuyển đổi giữa các đối tượng)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Các dịch vụ AI và Google Calendar đã được gỡ bỏ để làm sạch dự án

// Đăng ký các dịch vụ Multi-Tenant (Hệ thống đa thuê bao)
builder.Services.AddScoped<TodoApi.Services.MultiTenantMigrationService>();
builder.Services.AddScoped<TodoApi.Services.TenantDatabaseService>();
builder.Services.AddScoped<TodoApi.Services.IndexCreationService>();
builder.Services.AddScoped<TodoApi.Helpers.TenantSecurityHelper>();

// --- BẮT ĐẦU CẤU HÌNH HỆ THỐNG IDENTITY & JWT (XÁC THỰC TOKEN) ---

// 4. Thêm hệ thống Identity với MongoDB (thay vì SQL Server truyền thống)
builder.Services.AddIdentity<TodoApi.Models.MongoIdentity.AppUser, TodoApi.Models.MongoIdentity.IdentityRole>()
    .AddDefaultTokenProviders();

// Đăng ký các custom MongoDB stores cho Identity
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

// 5. Thêm dịch vụ Xác thực (Authentication) và cấu hình JWT Token
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Tắt yêu cầu HTTPS (chỉ dùng trong môi trường development)
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = configuration["JwtConfig:Audience"],
        ValidIssuer = configuration["JwtConfig:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtConfig:Secret"])),
        // Cấu hình để đọc các role claims (vai trò) từ token
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };
});

// 6. Thêm dịch vụ Phân quyền (Authorization) để hỗ trợ kiểm soát truy cập dựa trên vai trò (role-based access control)
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
            
            // Kiểm tra vai trò không phân biệt chữ hoa/thường (case-insensitive)
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

// Dịch vụ AiPredictionService đã được gỡ bỏ

// --- KẾT THÚC PHẦN CẤU HÌNH ---

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Thêm định nghĩa bảo mật (Security Definition) cho JWT Token
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field (ví dụ: Bearer {token})",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Yêu cầu tất cả các request phải gửi kèm token xác thực
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

// ... (Cấu hình middleware Swagger cho development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// === VỊ TRÍ 2: SỬ DỤNG MIDDLEWARE CORS ===
// (Rất quan trọng về thứ tự: Phải đặt SAU UseRouting (ẩn - ASP.NET Core tự động gọi),
// và TRƯỚC UseAuthentication/UseAuthorization)

app.UseCors(MyAllowSpecificOrigins); // <-- THÊM DÒNG NÀY ĐỂ KÍCH HOẠT CORS

// (QUAN TRỌNG: Phải nằm SAU UseCors và TRƯỚC MapControllers)
app.UseAuthentication(); // Bật chức năng "Xác thực" (kiểm tra token)
app.UseAuthorization();  // Bật chức năng "Phân quyền" (kiểm tra vai trò)

// Tùy chọn: Tenant Validation Middleware (bỏ comment nếu muốn sử dụng)
// app.UseTenantValidation();
// ========================================

await SeedRoles(app);

app.MapControllers();
app.Run();

async Task SeedRoles(WebApplication app)
{
    // Bước 1: Tạo một "scope" (phạm vi) dịch vụ để lấy các service cần thiết
    using (var scope = app.Services.CreateScope())
    {
        // Bước 2: Lấy RoleManager từ service provider (sử dụng custom IdentityRole cho MongoDB)
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<TodoApi.Models.MongoIdentity.IdentityRole>>();

        // Bước 3: Danh sách các vai trò (roles) bạn muốn tạo trong hệ thống
        string[] roleNames = { "Admin", "User" };

        foreach (var roleName in roleNames)
        {
            // Bước 4: Kiểm tra xem vai trò đã tồn tại trong hệ thống chưa
            var roleExists = await roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                // Bước 5: Nếu chưa có, tạo vai trò mới
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