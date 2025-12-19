# 📚 KEY CODE VÀ THƯ VIỆN SỬ DỤNG

Tài liệu này mô tả chi tiết các đoạn code chính (key code) và thư viện được sử dụng trong từng chức năng của dự án NEXUS-403.

---

## 📦 Danh Sách Thư Viện Chính

### 1. NuGet Packages
```xml
<!-- TodoApi.csproj -->
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
<PackageReference Include="Google.Apis.Auth" Version="1.73.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.10" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.10" />
<PackageReference Include="MongoDB.Driver" Version="2.28.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="9.0.6" />
```

### 2. Framework
- **.NET 9.0** - Framework chính
- **ASP.NET Core Web API** - Web API framework

---

## 🔐 1. AUTHENTICATION & AUTHORIZATION

### Thư Viện
- `Microsoft.AspNetCore.Authentication.JwtBearer` - JWT authentication
- `Microsoft.AspNetCore.Identity` - Identity framework
- `Microsoft.IdentityModel.Tokens` - JWT token validation
- `System.IdentityModel.Tokens.Jwt` - JWT token generation
- `Google.Apis.Auth` - Google OAuth authentication

### Key Code

#### 1.1. JWT Configuration (Program.cs)
```csharp
// Đăng ký JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = configuration["JwtConfig:Audience"],
        ValidIssuer = configuration["JwtConfig:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["JwtConfig:Secret"])
        ),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };
});
```

#### 1.2. JWT Token Generation (AuthController.cs)
```csharp
private async Task<string> GenerateJwtToken(AppUser user)
{
    var roles = await _userManager.GetRolesAsync(user);
    
    var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Name, user.UserName ?? ""),
        new Claim(ClaimTypes.Email, user.Email ?? ""),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    };

    // Thêm roles vào claims
    foreach (var role in roles)
    {
        claims.Add(new Claim(ClaimTypes.Role, role));
    }

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_configuration["JwtConfig:Secret"])
    );
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _configuration["JwtConfig:Issuer"],
        audience: _configuration["JwtConfig:Audience"],
        claims: claims,
        expires: DateTime.Now.AddDays(7),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

#### 1.3. Google OAuth Login
```csharp
// Verify Google ID Token
var settings = new GoogleJsonWebSignature.ValidationSettings
{
    Audience = new[] { _configuration["GoogleAuth:ClientId"] }
};

var payload = await GoogleJsonWebSignature.ValidateAsync(
    googleDto.IdToken, 
    settings
);
```

#### 1.4. Role-Based Authorization (Program.cs)
```csharp
builder.Services.AddAuthorization(options =>
{
    // Admin-only policy
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireAssertion(context => 
        {
            var roleClaims = context.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();
            
            return roleClaims.Any(role => 
                role.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        }));
});
```

---

## 🗄️ 2. MONGODB INTEGRATION

### Thư Viện
- `MongoDB.Driver` - MongoDB official driver
- `MongoDB.Bson` - BSON document handling

### Key Code

#### 2.1. MongoDB Connection (Program.cs)
```csharp
var mongoConnectionString = configuration.GetConnectionString("MongoDbConnection");
var mongoDatabaseName = configuration.GetConnectionString("MongoDbDatabaseName");

// Tạo MongoDB client settings với TLS
var mongoClientSettings = MongoClientSettings.FromConnectionString(mongoConnectionString);
mongoClientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(10);
mongoClientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);

var mongoClient = new MongoClient(mongoClientSettings);
builder.Services.AddSingleton<IMongoClient>(mongoClient);
```

#### 2.2. MongoDbContext (Data/MongoDbContext.cs)
```csharp
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IMongoClient client, string databaseName)
    {
        _database = client.GetDatabase(databaseName);
    }

    // Collections
    public IMongoCollection<Project> Projects => 
        GetCollection<Project>("projects");
    
    public IMongoCollection<TodoList> TodoLists => 
        GetCollection<TodoList>("todoLists");
    
    public IMongoCollection<TodoItem> TodoItems => 
        GetCollection<TodoItem>("todoItems");
    
    public IMongoCollection<UserApp> UserApps => 
        GetCollection<UserApp>("userApps");
    
    // Identity collections
    public IMongoCollection<AppUser> Users => 
        GetCollection<AppUser>("users");
    
    public IMongoCollection<IdentityRole> Roles => 
        GetCollection<IdentityRole>("roles");
}
```

#### 2.3. MongoDB CRUD Operations Example
```csharp
// CREATE
var project = new Project { Name = "Test", AppUserId = userId };
await _mongoContext.Projects.InsertOneAsync(project);

// READ - Single
var filter = Builders<Project>.Filter.Eq(p => p.Id, projectId);
var project = await _mongoContext.Projects.Find(filter).FirstOrDefaultAsync();

// READ - Multiple with filter
var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
var projects = await _mongoContext.Projects
    .Find(filter)
    .Sort(sort)
    .ToListAsync();

// UPDATE
var filter = Builders<Project>.Filter.Eq(p => p.Id, projectId);
var update = Builders<Project>.Update
    .Set(p => p.Name, updateDto.Name)
    .Set(p => p.Description, updateDto.Description);
await _mongoContext.Projects.UpdateOneAsync(filter, update);

// DELETE
var filter = Builders<Project>.Filter.Eq(p => p.Id, projectId);
await _mongoContext.Projects.DeleteOneAsync(filter);

// COUNT
var filter = Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds);
var count = await _mongoContext.TodoItems.CountDocumentsAsync(filter);
```

---

## 👤 3. MONGODB IDENTITY STORES

### Thư Viện
- `Microsoft.AspNetCore.Identity` - Identity framework
- `MongoDB.Driver` - MongoDB operations

### Key Code

#### 3.1. Custom User Store (Data/MongoIdentity/MongoUserStore.cs)
```csharp
public class MongoUserStore : IUserStore<AppUser>, 
    IUserPasswordStore<AppUser>,
    IUserEmailStore<AppUser>,
    IUserRoleStore<AppUser>
{
    private readonly IMongoCollection<AppUser> _users;

    public async Task<IdentityResult> CreateAsync(
        AppUser user, 
        CancellationToken cancellationToken)
    {
        user.Id = ObjectId.GenerateNewId().ToString();
        await _users.InsertOneAsync(user, cancellationToken: cancellationToken);
        return IdentityResult.Success;
    }

    public async Task<AppUser> FindByEmailAsync(
        string normalizedEmail, 
        CancellationToken cancellationToken)
    {
        var filter = Builders<AppUser>.Filter.Eq(u => u.NormalizedEmail, normalizedEmail);
        return await _users.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }
}
```

#### 3.2. Custom Role Store (Data/MongoIdentity/MongoRoleStore.cs)
```csharp
public class MongoRoleStore : IRoleStore<IdentityRole>
{
    private readonly IMongoCollection<IdentityRole> _roles;

    public async Task<IdentityResult> CreateAsync(
        IdentityRole role, 
        CancellationToken cancellationToken)
    {
        role.Id = ObjectId.GenerateNewId().ToString();
        await _roles.InsertOneAsync(role, cancellationToken: cancellationToken);
        return IdentityResult.Success;
    }
}
```

#### 3.3. Identity Registration (Program.cs)
```csharp
// Đăng ký Identity với MongoDB stores
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IUserStore<AppUser>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new MongoUserStore(mongoContext.Database);
});

builder.Services.AddScoped<IRoleStore<IdentityRole>>(sp =>
{
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new MongoRoleStore(mongoContext.Database);
});
```

---

## 🏢 4. MULTI-TENANT ARCHITECTURE

### Thư Viện
- `MongoDB.Driver` - MongoDB operations
- `System.Security.Cryptography` - Hashing for database names

### Key Code

#### 4.1. Tenant Database Service (Services/TenantDatabaseService.cs)
```csharp
public class TenantDatabaseService
{
    private readonly IMongoClient _mongoClient;

    // Generate database name cho app
    public string GenerateDatabaseName(string appId)
    {
        if (appId.Length <= 50 && IsValidDatabaseName(appId))
        {
            return $"app_{appId}";
        }
        
        var hash = ComputeHash(appId);
        return $"app_{hash}";
    }

    // Tạo separate database
    public async Task<IMongoDatabase> CreateSeparateDatabaseAsync(string databaseName)
    {
        var database = _mongoClient.GetDatabase(databaseName);
        
        // MongoDB tự động tạo database khi có first write
        var testCollection = database.GetCollection<BsonDocument>("_init");
        await testCollection.InsertOneAsync(
            new BsonDocument { { "_id", ObjectId.GenerateNewId() }, { "init", true } }
        );
        await testCollection.DeleteOneAsync(
            Builders<BsonDocument>.Filter.Eq("init", true)
        );
        
        return database;
    }

    // Xóa separate database
    public async Task DeleteSeparateDatabaseAsync(string databaseName)
    {
        await _mongoClient.DropDatabaseAsync(databaseName);
    }
}
```

#### 4.2. App Database Context (Data/AppDbContext.cs)
```csharp
public class AppDbContext
{
    private readonly IMongoClient _mongoClient;
    private readonly MongoDbContext _mainContext;

    // Lấy collection từ đúng database (app hoặc main)
    public IMongoCollection<T> GetAppCollection<T>(
        string? appId, 
        string collectionName)
    {
        // Nếu không có appId, dùng main database
        if (string.IsNullOrWhiteSpace(appId))
        {
            return _mainContext.GetCollection<T>(collectionName);
        }

        // Tìm UserApp để biết tenantMode
        var app = _mainContext.UserApps
            .Find(a => a.Id == appId)
            .FirstOrDefault();

        if (app == null || app.TenantMode == "shared")
        {
            return _mainContext.GetCollection<T>(collectionName);
        }

        // Isolated mode: dùng separate database
        if (!string.IsNullOrWhiteSpace(app.DatabaseName))
        {
            var database = _mongoClient.GetDatabase(app.DatabaseName);
            return database.GetCollection<T>(collectionName);
        }

        return _mainContext.GetCollection<T>(collectionName);
    }
}
```

#### 4.3. Multi-Tenant Migration (Services/MultiTenantMigrationService.cs)
```csharp
public class MultiTenantMigrationService
{
    // Migrate từ shared sang isolated
    public async Task<int> MigrateToIsolatedAsync(
        string appId, 
        string userId, 
        string targetDatabaseName)
    {
        var sourceDb = _mongoClient.GetDatabase(_mainContext.Database.DatabaseNamespace.DatabaseName);
        var targetDb = _mongoClient.GetDatabase(targetDatabaseName);

        // Copy TodoLists
        var listsFilter = Builders<TodoList>.Filter.And(
            Builders<TodoList>.Filter.Eq(l => l.AppUserId, userId),
            Builders<TodoList>.Filter.Eq(l => l.AppId, appId)
        );
        var lists = await sourceDb.GetCollection<TodoList>("todoLists")
            .Find(listsFilter)
            .ToListAsync();
        
        if (lists.Any())
        {
            await targetDb.GetCollection<TodoList>("todoLists")
                .InsertManyAsync(lists);
        }

        // Copy TodoItems
        var listIds = lists.Select(l => l.Id).ToList();
        var itemsFilter = Builders<TodoItem>.Filter.In(i => i.TodoListId, listIds);
        var items = await sourceDb.GetCollection<TodoItem>("todoItems")
            .Find(itemsFilter)
            .ToListAsync();
        
        if (items.Any())
        {
            await targetDb.GetCollection<TodoItem>("todoItems")
                .InsertManyAsync(items);
        }

        return lists.Count + items.Count;
    }
}
```

#### 4.4. Tenant Security Helper (Helpers/TenantSecurityHelper.cs)
```csharp
public class TenantSecurityHelper
{
    // Verify app ownership
    public async Task<bool> VerifyAppOwnershipAsync(string? appId, string userId)
    {
        if (string.IsNullOrWhiteSpace(appId))
        {
            return true; // No appId = backward compatible
        }

        if (!IsValidObjectId(appId))
        {
            return false;
        }

        var app = await _mongoContext.UserApps
            .Find(a => a.Id == appId && a.AppUserId == userId)
            .FirstOrDefaultAsync();

        return app != null;
    }

    // Validate MongoDB ObjectId format
    public bool IsValidObjectId(string? appId)
    {
        if (string.IsNullOrWhiteSpace(appId))
        {
            return false;
        }

        return ObjectId.TryParse(appId, out _);
    }
}
```

#### 4.5. Tenant Validation Middleware (Middleware/TenantValidationMiddleware.cs)
```csharp
public class TenantValidationMiddleware
{
    public async Task InvokeAsync(
        HttpContext context, 
        TenantSecurityHelper securityHelper)
    {
        var appId = context.Request.Query["appId"].FirstOrDefault();
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!string.IsNullOrWhiteSpace(appId) && !string.IsNullOrWhiteSpace(userId))
        {
            // Validate format
            if (!securityHelper.IsValidObjectId(appId))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsJsonAsync(new { 
                    message = "Invalid AppId format" 
                });
                return;
            }

            // Verify ownership
            var isOwned = await securityHelper.VerifyAppOwnershipAsync(appId, userId);
            if (!isOwned)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { 
                    message = "You don't have access to this app" 
                });
                return;
            }
        }

        await _next(context);
    }
}
```

---

## 🗂️ 5. PROJECT MANAGEMENT

### Thư Viện
- `MongoDB.Driver` - MongoDB operations
- `System.Security.Claims` - User authentication

### Key Code

#### 5.1. Create Project
```csharp
[HttpPost]
[Authorize]
public async Task<ActionResult<ProjectDTO>> CreateProject([FromBody] CreateProjectDTO dto)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    var project = new Project
    {
        Id = ObjectId.GenerateNewId().ToString(),
        Name = dto.Name,
        Description = dto.Description,
        JsonData = dto.JsonData,
        AppUserId = userId,
        IsPublished = false,
        CreatedAt = DateTime.UtcNow
    };

    await _mongoContext.Projects.InsertOneAsync(project);
    return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
}
```

#### 5.2. Get User Projects
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
{
    var userId = GetCurrentUserId();
    
    var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
    var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
    
    var projects = await _mongoContext.Projects
        .Find(filter)
        .Sort(sort)
        .ToListAsync();

    return Ok(projects);
}
```

#### 5.3. Publish Project to Marketplace
```csharp
[HttpPost("{id}/publish")]
public async Task<IActionResult> PublishProject(string id, [FromBody] PublishAppDTO dto)
{
    var userId = GetCurrentUserId();
    
    var filter = Builders<Project>.Filter.And(
        Builders<Project>.Filter.Eq(p => p.Id, id),
        Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
    );

    var update = Builders<Project>.Update
        .Set(p => p.IsPublished, true)
        .Set(p => p.Category, dto.Category)
        .Set(p => p.Price, dto.Price);

    var result = await _mongoContext.Projects.UpdateOneAsync(filter, update);

    if (result.MatchedCount == 0)
    {
        return NotFound();
    }

    return Ok(new { message = "Project published successfully!" });
}
```

---

## ✅ 6. TODO LISTS & ITEMS

### Thư Viện
- `MongoDB.Driver` - MongoDB operations
- `AutoMapper` - Object mapping

### Key Code

#### 6.1. Create TodoList with Multi-Tenant Support
```csharp
[HttpPost]
public async Task<ActionResult<TodoListDTO>> CreateTodoList([FromBody] CreateTodoListDTO dto)
{
    var userId = GetCurrentUserId();
    
    // Verify AppId ownership nếu có
    if (!string.IsNullOrWhiteSpace(dto.AppId))
    {
        if (!await _securityHelper.VerifyAppOwnershipAsync(dto.AppId, userId))
        {
            return Forbid("You don't have access to this app");
        }
    }

    var list = new TodoList
    {
        Id = ObjectId.GenerateNewId().ToString(),
        Name = dto.Name,
        Description = dto.Description,
        AppUserId = userId,
        AppId = dto.AppId,
        CreatedAt = DateTime.UtcNow
    };

    // Lấy collection từ đúng database
    var collection = _appContext.GetAppCollection<TodoList>(dto.AppId, "todoLists");
    await collection.InsertOneAsync(list);

    return CreatedAtAction(nameof(GetTodoList), new { id = list.Id }, list);
}
```

#### 6.2. Get TodoLists with Filtering
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<TodoListDTO>>> GetTodoLists(
    [FromQuery] string? appId = null)
{
    var userId = GetCurrentUserId();
    
    // Build filter
    var filterBuilder = Builders<TodoList>.Filter;
    var filter = filterBuilder.Eq(list => list.AppUserId, userId);

    // Filter theo appId nếu có
    if (!string.IsNullOrWhiteSpace(appId))
    {
        // Verify ownership
        if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
        {
            return Forbid("You don't have access to this app");
        }

        filter = filterBuilder.And(
            filter,
            filterBuilder.Eq(list => list.AppId, appId)
        );
    }

    var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
    var lists = await collection.Find(filter).ToListAsync();

    var listDtos = _mapper.Map<List<TodoListDTO>>(lists);
    return Ok(listDtos);
}
```

#### 6.3. Create TodoItem
```csharp
[HttpPost]
public async Task<ActionResult<TodoItemDTO>> CreateTodoItem([FromBody] CreateTodoItemDTO dto)
{
    var userId = GetCurrentUserId();
    
    // Verify AppId ownership
    if (!string.IsNullOrWhiteSpace(dto.AppId))
    {
        if (!await _securityHelper.VerifyAppOwnershipAsync(dto.AppId, userId))
        {
            return Forbid();
        }
    }

    var item = new TodoItem
    {
        Id = ObjectId.GenerateNewId().ToString(),
        Title = dto.Title,
        Description = dto.Description,
        Status = dto.Status,
        TodoListId = dto.TodoListId,
        AppId = dto.AppId,
        DueDate = dto.DueDate,
        Priority = dto.Priority,
        CreatedAt = DateTime.UtcNow
    };

    var collection = _appContext.GetAppCollection<TodoItem>(dto.AppId, "todoItems");
    await collection.InsertOneAsync(item);

    return CreatedAtAction(nameof(GetTodoItem), new { id = item.Id }, item);
}
```

#### 6.4. Update TodoItem Status
```csharp
[HttpPatch("{id}/status")]
public async Task<IActionResult> UpdateItemStatus(
    string id, 
    [FromBody] UpdateItemStatusDTO dto)
{
    var userId = GetCurrentUserId();
    
    var filter = Builders<TodoItem>.Filter.Eq(i => i.Id, id);
    var update = Builders<TodoItem>.Update.Set(i => i.Status, dto.Status);

    var collection = _appContext.GetAppCollection<TodoItem>(null, "todoItems");
    var result = await collection.UpdateOneAsync(filter, update);

    if (result.MatchedCount == 0)
    {
        return NotFound();
    }

    return Ok(new { message = "Item status updated successfully" });
}
```

---

## 📊 7. DASHBOARD STATISTICS

### Thư Viện
- `MongoDB.Driver` - MongoDB aggregations

### Key Code

#### 7.1. Get Dashboard Stats
```csharp
[HttpGet("stats")]
public async Task<ActionResult<DashboardStatsDTO>> GetDashboardStats()
{
    var userId = GetCurrentUserId();

    // 1. Đếm tổng số List
    var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId);
    var totalLists = (int)await _mongoContext.TodoLists.CountDocumentsAsync(listFilter);

    // 2. Lấy tất cả listIds
    var userLists = await _mongoContext.TodoLists.Find(listFilter).ToListAsync();
    var listIds = userLists.Select(l => l.Id).ToList();

    // 3. Đếm tổng số Task
    var itemFilter = Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds);
    var totalTasks = (int)await _mongoContext.TodoItems.CountDocumentsAsync(itemFilter);

    // 4. Đếm Task đã hoàn thành (Status == 2)
    var completedFilter = Builders<TodoItem>.Filter.And(
        Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds),
        Builders<TodoItem>.Filter.Eq(item => item.Status, 2)
    );
    var completedTasks = (int)await _mongoContext.TodoItems.CountDocumentsAsync(completedFilter);

    return Ok(new DashboardStatsDTO
    {
        TotalLists = totalLists,
        TotalTasks = totalTasks,
        CompletedTasks = completedTasks
    });
}
```

---

## 🛒 8. MARKETPLACE

### Thư Viện
- `MongoDB.Driver` - MongoDB queries

### Key Code

#### 8.1. Get Marketplace Apps with Filtering
```csharp
[HttpGet("apps")]
public async Task<IActionResult> GetApps([FromQuery] string? category = null)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    // 1. Lấy published projects
    var filter = Builders<Project>.Filter.Eq(p => p.IsPublished, true);
    
    if (!string.IsNullOrEmpty(category) && category != "All")
    {
        filter = Builders<Project>.Filter.And(
            filter,
            Builders<Project>.Filter.Eq(p => p.Category, category)
        );
    }

    var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
    var publishedProjects = await _mongoContext.Projects
        .Find(filter)
        .Sort(sort)
        .ToListAsync();

    // 2. Check installed apps
    var installedAppIds = new HashSet<string>();
    if (!string.IsNullOrEmpty(userId))
    {
        var installedFilter = Builders<Project>.Filter.And(
            Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
            Builders<Project>.Filter.Ne(p => p.MarketplaceAppId, null)
        );
        var installed = await _mongoContext.Projects
            .Find(installedFilter)
            .Project(p => p.MarketplaceAppId)
            .ToListAsync();
        installedAppIds = new HashSet<string>(installed.Where(id => !string.IsNullOrEmpty(id)));
    }

    // 3. Tính install counts
    var installCounts = new Dictionary<string, int>();
    foreach (var project in publishedProjects)
    {
        var countFilter = Builders<Project>.Filter.Eq(p => p.MarketplaceAppId, project.Id);
        var count = await _mongoContext.Projects.CountDocumentsAsync(countFilter);
        installCounts[project.Id] = (int)count;
    }

    // 4. Map to DTO
    var marketplaceApps = publishedProjects.Select(p => new MarketplaceAppDTO
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description ?? "No description",
        Category = p.Category ?? "Template",
        Downloads = installCounts[p.Id].ToString(),
        IsInstalled = installedAppIds.Contains(p.Id),
        Price = p.Price
    }).ToList();

    return Ok(marketplaceApps);
}
```

#### 8.2. Install App from Marketplace
```csharp
[HttpPost("install/{id}")]
public async Task<IActionResult> InstallApp(string id, [FromBody] InstallAppRequestDTO dto)
{
    var userId = GetCurrentUserId();

    // 1. Get marketplace app
    var sourceProject = await _mongoContext.Projects
        .Find(p => p.Id == id && p.IsPublished == true)
        .FirstOrDefaultAsync();

    if (sourceProject == null)
    {
        return NotFound(new { message = "App not found in marketplace" });
    }

    // 2. Clone project
    var newProject = new Project
    {
        Id = ObjectId.GenerateNewId().ToString(),
        Name = sourceProject.Name,
        Description = sourceProject.Description,
        JsonData = sourceProject.JsonData,
        AppUserId = userId,
        IsPublished = false,
        MarketplaceAppId = id,
        CreatedAt = DateTime.UtcNow
    };

    await _mongoContext.Projects.InsertOneAsync(newProject);

    // 3. Create UserApp
    var userApp = new UserApp
    {
        Id = ObjectId.GenerateNewId().ToString(),
        Name = sourceProject.Name,
        AppUserId = userId,
        Source = "downloaded",
        MarketplaceAppId = id,
        TenantMode = dto.TenantMode ?? "shared",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    // 4. Create isolated database if needed
    if (userApp.TenantMode == "isolated")
    {
        var dbName = _tenantDatabaseService.GenerateDatabaseName(userApp.Id);
        await _tenantDatabaseService.CreateSeparateDatabaseAsync(dbName);
        userApp.DatabaseName = dbName;
    }

    await _mongoContext.UserApps.InsertOneAsync(userApp);

    return Ok(new
    {
        message = "App installed successfully",
        projectId = newProject.Id,
        userAppId = userApp.Id
    });
}
```

---

## 📱 9. USER APPS MANAGEMENT

### Thư Viện
- `MongoDB.Driver` - MongoDB operations

### Key Code

#### 9.1. Get User Apps with Filtering
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<UserAppDTO>>> GetUserApps(
    [FromQuery] string filter = "all")
{
    var userId = GetCurrentUserId();

    var baseFilter = Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId);
    FilterDefinition<UserApp>? filterDef = null;

    if (filter == "created")
    {
        filterDef = Builders<UserApp>.Filter.And(
            baseFilter,
            Builders<UserApp>.Filter.Eq(a => a.Source, "created")
        );
    }
    else if (filter == "downloaded")
    {
        filterDef = Builders<UserApp>.Filter.And(
            baseFilter,
            Builders<UserApp>.Filter.Eq(a => a.Source, "downloaded")
        );
    }
    else
    {
        filterDef = baseFilter;
    }

    var apps = await _mongoContext.UserApps
        .Find(filterDef)
        .SortByDescending(a => a.UpdatedAt)
        .ToListAsync();

    return Ok(apps);
}
```

#### 9.2. Switch Tenant Mode
```csharp
[HttpPost("{id}/switch-tenant-mode")]
public async Task<IActionResult> SwitchTenantMode(
    string id, 
    [FromBody] SwitchTenantModeDTO dto)
{
    var userId = GetCurrentUserId();

    var app = await _mongoContext.UserApps
        .Find(a => a.Id == id && a.AppUserId == userId)
        .FirstOrDefaultAsync();

    if (app == null)
    {
        return NotFound();
    }

    var oldMode = app.TenantMode ?? "shared";
    var newMode = dto.NewTenantMode;

    if (oldMode == newMode)
    {
        return BadRequest(new { message = "App is already in this mode" });
    }

    // Shared -> Isolated
    if (oldMode == "shared" && newMode == "isolated")
    {
        var dbName = _tenantDatabaseService.GenerateDatabaseName(id);
        await _tenantDatabaseService.CreateSeparateDatabaseAsync(dbName);
        
        // Migrate data
        var migratedCount = await _migrationService.MigrateToIsolatedAsync(
            id, userId, dbName
        );

        // Update app
        var update = Builders<UserApp>.Update
            .Set(a => a.TenantMode, "isolated")
            .Set(a => a.DatabaseName, dbName)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        await _mongoContext.UserApps.UpdateOneAsync(
            Builders<UserApp>.Filter.Eq(a => a.Id, id),
            update
        );
    }
    // Isolated -> Shared
    else if (oldMode == "isolated" && newMode == "shared")
    {
        // Migrate data back
        var migratedCount = await _migrationService.MigrateToSharedAsync(
            id, userId, app.DatabaseName
        );

        // Delete isolated database
        await _tenantDatabaseService.DeleteSeparateDatabaseAsync(app.DatabaseName);

        // Update app
        var update = Builders<UserApp>.Update
            .Set(a => a.TenantMode, "shared")
            .Set(a => a.DatabaseName, null)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        await _mongoContext.UserApps.UpdateOneAsync(
            Builders<UserApp>.Filter.Eq(a => a.Id, id),
            update
        );
    }

    return Ok(new { message = "Tenant mode switched successfully" });
}
```

#### 9.3. Delete UserApp with Database Cleanup
```csharp
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUserApp(string id)
{
    var userId = GetCurrentUserId();

    var app = await _mongoContext.UserApps
        .Find(a => a.Id == id && a.AppUserId == userId)
        .FirstOrDefaultAsync();

    if (app == null)
    {
        return NotFound();
    }

    // Delete isolated database if exists
    if (app.TenantMode == "isolated" && !string.IsNullOrWhiteSpace(app.DatabaseName))
    {
        await _tenantDatabaseService.DeleteSeparateDatabaseAsync(app.DatabaseName);
    }

    // Delete from shared database if tenant mode is shared
    if (app.TenantMode == "shared")
    {
        // Delete TodoLists
        var listFilter = Builders<TodoList>.Filter.And(
            Builders<TodoList>.Filter.Eq(l => l.AppUserId, userId),
            Builders<TodoList>.Filter.Eq(l => l.AppId, id)
        );
        var lists = await _mongoContext.TodoLists.Find(listFilter).ToListAsync();
        var listIds = lists.Select(l => l.Id).ToList();

        if (listIds.Any())
        {
            // Delete TodoItems
            var itemFilter = Builders<TodoItem>.Filter.In(i => i.TodoListId, listIds);
            await _mongoContext.TodoItems.DeleteManyAsync(itemFilter);
        }

        // Delete lists
        await _mongoContext.TodoLists.DeleteManyAsync(listFilter);
    }

    // Delete app
    await _mongoContext.UserApps.DeleteOneAsync(
        Builders<UserApp>.Filter.Eq(a => a.Id, id)
    );

    return NoContent();
}
```

---

## 👑 10. ADMIN FEATURES

### Thư Viện
- `Microsoft.AspNetCore.Identity` - User management
- `MongoDB.Driver` - Database operations

### Key Code

#### 10.1. Get All Users (Admin Only)
```csharp
[HttpGet("users")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> GetUsers()
{
    var usersList = await _mongoContext.Users.Find(_ => true).ToListAsync();

    var usersDto = new List<object>();
    foreach (var user in usersList)
    {
        var roles = await _userManager.GetRolesAsync(user);
        usersDto.Add(new
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            IsLocked = user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow,
            LockoutEnd = user.LockoutEnd,
            Roles = roles.ToList()
        });
    }

    return Ok(usersDto);
}
```

#### 10.2. Lock/Unlock User
```csharp
[HttpPost("users/{userId}/lock")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> LockUser(string userId)
{
    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
        return NotFound();
    }

    // Lock user for 100 years (effectively permanent)
    await _userManager.SetLockoutEndDateAsync(
        user, 
        DateTimeOffset.UtcNow.AddYears(100)
    );
    await _userManager.SetLockoutEnabledAsync(user, true);

    return Ok(new { message = "User locked successfully" });
}

[HttpPost("users/{userId}/unlock")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> UnlockUser(string userId)
{
    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
    {
        return NotFound();
    }

    await _userManager.SetLockoutEndDateAsync(user, null);

    return Ok(new { message = "User unlocked successfully" });
}
```

---

## 🔄 11. AUTOMAPPER CONFIGURATION

### Thư Viện
- `AutoMapper.Extensions.Microsoft.DependencyInjection` - AutoMapper DI

### Key Code

#### 11.1. Mapping Profile (Profiles/MappingProfile.cs)
```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // TodoList mappings
        CreateMap<TodoList, TodoListDTO>();
        CreateMap<CreateTodoListDTO, TodoList>();

        // TodoItem mappings
        CreateMap<TodoItem, TodoItemDTO>();
        CreateMap<CreateTodoItemDTO, TodoItem>();
    }
}
```

#### 11.2. AutoMapper Registration (Program.cs)
```csharp
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
```

#### 11.3. Using AutoMapper in Controller
```csharp
private readonly IMapper _mapper;

public TodoListsController(IMapper mapper)
{
    _mapper = mapper;
}

// Usage
var lists = await collection.Find(filter).ToListAsync();
var listDtos = _mapper.Map<List<TodoListDTO>>(lists);
```

---

## 🌐 12. CORS CONFIGURATION

### Thư Viện
- Built-in ASP.NET Core CORS

### Key Code

#### 12.1. CORS Setup (Program.cs)
```csharp
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:3000",  // React
                    "http://localhost:5173",  // Vite
                    "http://localhost:5174"   // Vite alternate
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

// Usage in middleware pipeline
app.UseCors(MyAllowSpecificOrigins);
```

---

## 📝 13. SWAGGER/OPENAPI CONFIGURATION

### Thư Viện
- `Swashbuckle.AspNetCore` - Swagger generation
- `Microsoft.AspNetCore.OpenApi` - OpenAPI support

### Key Code

#### 13.1. Swagger with JWT Support (Program.cs)
```csharp
builder.Services.AddSwaggerGen(options =>
{
    // JWT Security Definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Security Requirement
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Enable Swagger in middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

---

## 🏥 14. HEALTH CHECK

### Thư Viện
- `MongoDB.Driver` - Database connectivity check

### Key Code

#### 14.1. Health Check Endpoint
```csharp
[HttpGet]
public async Task<IActionResult> CheckHealth()
{
    try
    {
        // Test MongoDB connection
        var collections = await _mongoContext.Projects.Database.ListCollectionNamesAsync();
        var collectionList = await collections.ToListAsync();
        
        // Count documents
        var projectCount = await _mongoContext.Projects.CountDocumentsAsync(_ => true);
        var todoListCount = await _mongoContext.TodoLists.CountDocumentsAsync(_ => true);
        var todoItemCount = await _mongoContext.TodoItems.CountDocumentsAsync(_ => true);
        
        return Ok(new
        {
            status = "healthy",
            mongodb = "connected",
            database = _mongoContext.Projects.Database.DatabaseNamespace.DatabaseName,
            collections = collectionList,
            counts = new
            {
                projects = projectCount,
                todoLists = todoListCount,
                todoItems = todoItemCount
            },
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            status = "unhealthy",
            error = ex.Message,
            timestamp = DateTime.UtcNow
        });
    }
}
```

---

## 🔧 15. DEPENDENCY INJECTION SETUP

### Key Services Registration (Program.cs)

```csharp
// MongoDB
builder.Services.AddSingleton<IMongoClient>(mongoClient);
builder.Services.AddScoped<MongoDbContext>();
builder.Services.AddScoped<AppDbContext>();

// Identity
builder.Services.AddIdentity<AppUser, IdentityRole>();
builder.Services.AddScoped<IUserStore<AppUser>, MongoUserStore>();
builder.Services.AddScoped<IRoleStore<IdentityRole>, MongoRoleStore>();

// Multi-Tenant Services
builder.Services.AddScoped<MultiTenantMigrationService>();
builder.Services.AddScoped<TenantDatabaseService>();
builder.Services.AddScoped<IndexCreationService>();
builder.Services.AddScoped<TenantSecurityHelper>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* config */ });
builder.Services.AddAuthorization(options => { /* policies */ });

// Controllers & JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
```

---

## 📋 Tóm Tắt Thư Viện Theo Chức Năng

| Chức Năng | Thư Viện Chính |
|-----------|----------------|
| **Database** | MongoDB.Driver, MongoDB.Bson |
| **Authentication** | Microsoft.AspNetCore.Authentication.JwtBearer, System.IdentityModel.Tokens.Jwt |
| **Identity** | Microsoft.AspNetCore.Identity |
| **OAuth** | Google.Apis.Auth |
| **Mapping** | AutoMapper.Extensions.Microsoft.DependencyInjection |
| **API Documentation** | Swashbuckle.AspNetCore, Microsoft.AspNetCore.OpenApi |
| **Security** | Microsoft.IdentityModel.Tokens, System.Security.Claims, System.Security.Cryptography |
| **Framework** | .NET 9.0, ASP.NET Core Web API |

---

## 🎯 Best Practices Được Áp Dụng

1. **Dependency Injection** - Tất cả services được inject qua constructor
2. **Repository Pattern** - MongoDbContext là abstraction layer cho database
3. **DTO Pattern** - Dùng DTOs cho request/response bodies
4. **AutoMapper** - Tự động map giữa entities và DTOs
5. **JWT Authentication** - Stateless authentication với JWT tokens
6. **Role-Based Authorization** - Policies cho Admin và User roles
7. **Multi-Tenant Architecture** - Hỗ trợ shared và isolated database modes
8. **Security Validation** - Verify ownership trước khi truy cập resources
9. **Logging** - ILogger được inject và sử dụng xuyên suốt
10. **Error Handling** - Try-catch và return appropriate status codes

---

**Tài liệu này giúp developers hiểu rõ các thư viện và key code patterns được sử dụng trong dự án! 🚀**
