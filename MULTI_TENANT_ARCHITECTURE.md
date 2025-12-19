# 🏢 KIẾN TRÚC MULTI-TENANT - DỰ ÁN NEXUS-403

## 📋 TỔNG QUAN

**Multi-tenant** là kiến trúc cho phép nhiều người dùng (tenants) sử dụng cùng một ứng dụng với dữ liệu được cô lập và bảo mật. Trong dự án NEXUS-403, mỗi **UserApp** là một tenant độc lập, có thể chọn một trong hai chế độ:

### Hai chế độ Multi-tenant:

| Chế độ | Mô tả | Use Case |
|--------|-------|----------|
| **Shared** | Tất cả apps dùng chung database, phân biệt bằng `appId` | Phù hợp cho apps nhỏ, ít data, muốn tiết kiệm tài nguyên |
| **Isolated** | Mỗi app có database riêng biệt | Phù hợp cho apps lớn, nhiều data, cần bảo mật cao |

---

## 🏗️ KIẾN TRÚC TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────────┐
│                         ASP.NET Core API                        │
│                   (JWT Authentication Layer)                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │  TenantValidationMiddleware   │
                │  (Verify App Ownership)       │
                └───────────────┬───────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        │        🔍 Determine Tenant Mode               │
        │                                               │
        │    ┌─────────────────────────────────────┐   │
        │    │  TenantSecurityHelper               │   │
        │    │  - VerifyAppOwnership()             │   │
        │    │  - ValidateObjectId()               │   │
        │    └─────────────────────────────────────┘   │
        │                                               │
        └───────────┬───────────────────┬───────────────┘
                    │                   │
    ┌───────────────┴─────┐   ┌─────────┴──────────────┐
    │   SHARED MODE       │   │   ISOLATED MODE        │
    │   Database: nexus   │   │   Database: app_{id}   │
    └───────────┬─────────┘   └─────────┬──────────────┘
                │                       │
    ┌───────────┴─────────┐   ┌─────────┴──────────────┐
    │  Collections:       │   │  Collections:          │
    │  - todoLists        │   │  - todoLists          │
    │  - todoItems        │   │  - todoItems          │
    │  - userApps         │   │  (copy từ shared)     │
    │  - projects         │   │                        │
    └─────────────────────┘   └────────────────────────┘
```

---

## 🎯 CÁC THÀNH PHẦN CHÍNH

### 1. **TenantValidationMiddleware**

Middleware này chặn tất cả requests và verify quyền truy cập app.

#### Luồng hoạt động:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Request đến: GET /api/todoitems?appId=abc123                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Extract appId từ query string hoặc route                    │
│    appId = "abc123"                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Extract userId từ JWT token                                 │
│    userId = "user_xyz" (từ ClaimTypes.NameIdentifier)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Validate appId format (MongoDB ObjectId)                    │
│    IsValidObjectId(appId)?                                      │
│    ├─ Valid: Continue                                           │
│    └─ Invalid: Return 400 Bad Request                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Verify App Ownership                                         │
│    TenantSecurityHelper.VerifyAppOwnershipAsync(appId, userId) │
│                                                                 │
│    Query: UserApps.Find(a => a.Id == appId                     │
│                           && a.AppUserId == userId)             │
│                                                                 │
│    ├─ Found: isOwned = true                                    │
│    └─ Not Found: isOwned = false                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Store in HttpContext                                         │
│    context.Items["AppId"] = appId                               │
│    context.Items["AppOwned"] = isOwned                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐               ┌───────────────────┐
│ isOwned = true    │               │ isOwned = false   │
│ Continue to       │               │ Return 403        │
│ Controller        │               │ Forbidden         │
└───────────────────┘               └───────────────────┘
```

#### Code Reference:

```csharp
// TodoApi/Middleware/TenantValidationMiddleware.cs

public async Task InvokeAsync(HttpContext context, TenantSecurityHelper securityHelper)
{
    // Extract appId
    var appId = context.Request.Query["appId"].FirstOrDefault() 
               ?? context.Request.RouteValues["appId"]?.ToString();

    // Extract userId
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
        
        context.Items["AppId"] = appId;
        context.Items["AppOwned"] = isOwned;

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
```

---

### 2. **TenantSecurityHelper**

Helper class để verify ownership và validate IDs.

#### Các methods chính:

```csharp
// 1. Verify App Ownership
public async Task<bool> VerifyAppOwnershipAsync(string? appId, string userId)
{
    var app = await _mongoContext.UserApps
        .Find(a => a.Id == appId && a.AppUserId == userId)
        .FirstOrDefaultAsync();
    
    return app != null;
}

// 2. Validate ObjectId format
public bool IsValidObjectId(string? appId)
{
    return ObjectId.TryParse(appId, out _);
}

// 3. Get UserApp if owned
public async Task<UserApp?> GetUserAppIfOwnedAsync(string? appId, string userId)
{
    return await _mongoContext.UserApps
        .Find(a => a.Id == appId && a.AppUserId == userId)
        .FirstOrDefaultAsync();
}

// 4. Verify and throw if not owned
public async Task VerifyAppOwnershipOrThrowAsync(string? appId, string userId)
{
    if (!await VerifyAppOwnershipAsync(appId, userId))
    {
        throw new UnauthorizedAccessException("You don't have access to this app");
    }
}
```

---

### 3. **TenantDatabaseService**

Service quản lý việc tạo và migrate sang database riêng biệt.

#### Chức năng chính:

**A. Generate Database Name**

```csharp
public string GenerateDatabaseName(string appId)
{
    // Format: app_{appId} hoặc app_{hash}
    if (appId.Length <= 50 && IsValidDatabaseName(appId))
    {
        return $"app_{appId}";
    }
    
    // Nếu appId quá dài, dùng hash SHA256
    var hash = ComputeHash(appId);
    return $"app_{hash}";
}
```

**B. Create Separate Database**

```csharp
public async Task<IMongoDatabase> CreateSeparateDatabaseAsync(string databaseName)
{
    var database = _mongoClient.GetDatabase(databaseName);
    
    // Tạo collections cơ bản
    await database.CreateCollectionAsync("todoLists");
    await database.CreateCollectionAsync("todoItems");
    
    return database;
}
```

**C. Migrate Data to Separate Database**

```csharp
public async Task<DatabaseMigrationResult> MigrateToSeparateDatabaseAsync(
    string appId, 
    string databaseName)
{
    // 1. Get source and target databases
    var sourceDatabase = _mainContext.Database; // "nexus"
    var targetDatabase = _mongoClient.GetDatabase(databaseName); // "app_abc123"
    
    // 2. Ensure target database exists
    await CreateSeparateDatabaseAsync(databaseName);
    
    // 3. Migrate TodoLists
    var sourceListsCollection = sourceDatabase.GetCollection<TodoList>("todoLists");
    var targetListsCollection = targetDatabase.GetCollection<TodoList>("todoLists");
    
    var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppId, appId);
    var lists = await sourceListsCollection.Find(listFilter).ToListAsync();
    
    if (lists.Any())
    {
        await targetListsCollection.InsertManyAsync(lists);
        result.TodoListsMigrated = lists.Count;
    }
    
    // 4. Migrate TodoItems
    var sourceItemsCollection = sourceDatabase.GetCollection<TodoItem>("todoItems");
    var targetItemsCollection = targetDatabase.GetCollection<TodoItem>("todoItems");
    
    var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.AppId, appId);
    var items = await sourceItemsCollection.Find(itemFilter).ToListAsync();
    
    if (items.Any())
    {
        await targetItemsCollection.InsertManyAsync(items);
        result.TodoItemsMigrated = items.Count;
    }
    
    // 5. Delete from source (optional)
    if (deleteFromSource)
    {
        await sourceListsCollection.DeleteManyAsync(listFilter);
        await sourceItemsCollection.DeleteManyAsync(itemFilter);
    }
    
    return result;
}
```

---

### 4. **UserApp Model**

Model lưu thông tin về tenant mode.

```csharp
public class UserApp
{
    [BsonId]
    public string Id { get; set; }
    
    public string Name { get; set; }
    
    // --- Tenant Configuration ---
    
    /// <summary>
    /// Tenant mode: "shared" hoặc "isolated"
    /// Default: "shared" (backward compatible)
    /// </summary>
    [BsonElement("tenantMode")]
    public string TenantMode { get; set; } = "shared";
    
    /// <summary>
    /// Database name cho isolated mode
    /// Format: app_{appId} hoặc app_{hash}
    /// Null nếu tenantMode = "shared"
    /// </summary>
    [BsonElement("databaseName")]
    public string? DatabaseName { get; set; }
    
    /// <summary>
    /// User sở hữu app
    /// </summary>
    [BsonElement("appUserId")]
    public string AppUserId { get; set; }
}
```

---

### 5. **TodoList & TodoItem Models**

Models với multi-tenant support.

```csharp
public class TodoList
{
    [BsonId]
    public string Id { get; set; }
    
    public string Name { get; set; }
    
    /// <summary>
    /// User sở hữu (backward compatible)
    /// </summary>
    [BsonElement("appUserId")]
    public string AppUserId { get; set; }
    
    /// <summary>
    /// App ID (Multi-tenant support)
    /// Nullable để backward compatible với existing data
    /// null = data cũ, không thuộc app cụ thể nào
    /// </summary>
    [BsonElement("appId")]
    public string? AppId { get; set; }
}

public class TodoItem
{
    [BsonId]
    public string Id { get; set; }
    
    public string? Title { get; set; }
    public int Status { get; set; }
    public int Priority { get; set; }
    
    /// <summary>
    /// List chứa item này
    /// </summary>
    [BsonElement("todoListId")]
    public string TodoListId { get; set; }
    
    /// <summary>
    /// App ID (Multi-tenant support)
    /// Nullable để backward compatible
    /// </summary>
    [BsonElement("appId")]
    public string? AppId { get; set; }
}
```

---

## 🔄 LUỒNG HOẠT ĐỘNG CHI TIẾT

### Scenario 1: Tạo TodoList trong Shared Mode

```
Frontend                    Backend                         Database
   |                          |                               |
   | 1. POST /api/todolists   |                               |
   |  {name: "Work",          |                               |
   |   appId: "abc123"}       |                               |
   |------------------------->|                               |
   |                          | 2. Middleware verify:         |
   |                          |    - appId format valid?      |
   |                          |    - user owns app abc123?    |
   |                          |------------------------->     |
   |                          | 3. App found & owned          |
   |                          |<-------------------------|    |
   |                          | 4. Check app.TenantMode       |
   |                          |    = "shared"                 |
   |                          | 5. Use main DB "nexus"        |
   |                          | 6. Create TodoList:           |
   |                          |    - appUserId = userId       |
   |                          |    - appId = "abc123"         |
   |                          |------------------------->     |
   |                          |                          nexus/todoLists
   |                          | 7. List created               |
   |                          |<-------------------------|    |
   | 8. Success               |                               |
   |<-------------------------|                               |
```

### Scenario 2: Chuyển sang Isolated Mode

```
Frontend                    Backend                         Database
   |                          |                               |
   | 1. POST /api/userapps/abc123/switch-tenant               |
   |  {mode: "isolated"}      |                               |
   |------------------------->|                               |
   |                          | 2. Verify ownership           |
   |                          |------------------------->     |
   |                          | 3. UserApp found              |
   |                          |<-------------------------|    |
   |                          | 4. Generate DB name:          |
   |                          |    "app_abc123"               |
   |                          | 5. Create new DB              |
   |                          |------------------------->     |
   |                          |                          [New DB]
   |                          |                          app_abc123
   |                          | 6. DB created                 |
   |                          |<-------------------------|    |
   |                          | 7. Migrate data:              |
   |                          |    Copy TodoLists where       |
   |                          |    appId = "abc123"           |
   |                          |------------------------->     |
   |                          |                          nexus → app_abc123
   |                          | 8. Data migrated              |
   |                          |<-------------------------|    |
   |                          | 9. Update UserApp:            |
   |                          |    tenantMode = "isolated"    |
   |                          |    databaseName = "app_abc123"|
   |                          |------------------------->     |
   |                          |                          nexus/userApps
   |                          | 10. UserApp updated           |
   |                          |<-------------------------|    |
   | 11. Success              |                               |
   |<-------------------------|                               |
```

### Scenario 3: Query trong Isolated Mode

```
Frontend                    Backend                         Database
   |                          |                               |
   | 1. GET /api/todolists    |                               |
   |  ?appId=abc123           |                               |
   |------------------------->|                               |
   |                          | 2. Middleware verify ownership|
   |                          | 3. Get UserApp abc123         |
   |                          |------------------------->     |
   |                          |                          nexus/userApps
   |                          | 4. UserApp found:             |
   |                          |    tenantMode = "isolated"    |
   |                          |    databaseName = "app_abc123"|
   |                          |<-------------------------|    |
   |                          | 5. Switch to isolated DB      |
   |                          | 6. Get IMongoDatabase         |
   |                          |    ("app_abc123")             |
   |                          | 7. Query TodoLists            |
   |                          |------------------------->     |
   |                          |                          app_abc123/todoLists
   |                          | 8. Lists found                |
   |                          |<-------------------------|    |
   | 9. Return lists          |                               |
   |<-------------------------|                               |
```

---

## 🛡️ BẢO MẬT VÀ PHÂN QUYỀN

### Security Layers:

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: JWT Authentication                                     │
│ - Verify token validity                                         │
│ - Extract userId from ClaimTypes.NameIdentifier                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Tenant Validation Middleware                           │
│ - Extract appId from request                                    │
│ - Validate appId format                                         │
│ - Verify app ownership (UserApp.appUserId == userId)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Controller Security Helper                             │
│ - TenantSecurityHelper.VerifyAppOwnershipAsync()               │
│ - Verify list/item ownership via appId                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Database-level Isolation                               │
│ - Shared Mode: Filter by appId                                  │
│ - Isolated Mode: Separate physical database                     │
└─────────────────────────────────────────────────────────────────┘
```

### Ví dụ về Security trong Controller:

```csharp
[HttpGet]
[Authorize]
public async Task<ActionResult<IEnumerable<TodoListDTO>>> GetTodoLists(
    [FromQuery] string? appId = null)
{
    var userId = GetCurrentUserId();
    
    // 1. Verify app ownership (nếu có appId)
    if (!string.IsNullOrWhiteSpace(appId))
    {
        // Middleware đã verify, nhưng double-check
        if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
        {
            return Forbid("You don't have access to this app");
        }
    }
    
    // 2. Build filter
    var filterBuilder = Builders<TodoList>.Filter;
    FilterDefinition<TodoList> filter;
    
    if (!string.IsNullOrWhiteSpace(appId))
    {
        // Query theo appId
        filter = filterBuilder.Eq(list => list.AppId, appId);
    }
    else
    {
        // Query theo userId (backward compatible)
        filter = filterBuilder.Eq(list => list.AppUserId, userId);
    }
    
    // 3. Execute query
    var lists = await _mongoContext.TodoLists
        .Find(filter)
        .ToListAsync();
    
    return Ok(lists);
}
```

---

## 📊 DATABASE SCHEMA

### Main Database: `nexus`

```
nexus/
├── users                    # Identity users
├── roles                    # Identity roles
├── userApps                 # Apps configuration
│   ├── _id
│   ├── name
│   ├── appUserId           # Owner
│   ├── tenantMode          # "shared" | "isolated"
│   └── databaseName        # "app_xxx" hoặc null
├── projects                 # App Builder projects
├── categories               # Marketplace categories
├── todoLists                # SHARED MODE lists
│   ├── _id
│   ├── name
│   ├── appUserId
│   └── appId               # Reference to UserApp
└── todoItems                # SHARED MODE items
    ├── _id
    ├── title
    ├── status
    ├── priority
    ├── todoListId
    └── appId               # Reference to UserApp
```

### Isolated Database: `app_{appId}`

```
app_abc123/                  # Isolated database cho app abc123
├── todoLists                # ISOLATED lists
│   ├── _id
│   ├── name
│   ├── appUserId
│   └── appId = "abc123"
└── todoItems                # ISOLATED items
    ├── _id
    ├── title
    ├── status
    ├── priority
    ├── todoListId
    └── appId = "abc123"
```

---

## 🔍 INDEXES (Tối ưu Performance)

### Main Database Indexes:

```javascript
// Collection: todoLists
db.todoLists.createIndex({ appUserId: 1, appId: 1 }, { name: "idx_appUserId_appId" });
db.todoLists.createIndex({ appId: 1 }, { name: "idx_appId" });
db.todoLists.createIndex({ appUserId: 1 }, { name: "idx_appUserId" });

// Collection: todoItems
db.todoItems.createIndex({ appId: 1, todoListId: 1 }, { name: "idx_appId_todoListId" });
db.todoItems.createIndex({ todoListId: 1 }, { name: "idx_todoListId" });
db.todoItems.createIndex({ appId: 1 }, { name: "idx_appId" });

// Collection: userApps
db.userApps.createIndex({ appUserId: 1 }, { name: "idx_appUserId" });
db.userApps.createIndex({ tenantMode: 1 }, { name: "idx_tenantMode" });
db.userApps.createIndex({ appUserId: 1, tenantMode: 1 }, { name: "idx_appUserId_tenantMode" });
```

### Isolated Database Indexes:

Mỗi isolated database cũng cần các indexes tương tự:

```javascript
// app_abc123
db.todoLists.createIndex({ appId: 1 }, { name: "idx_appId" });
db.todoItems.createIndex({ appId: 1, todoListId: 1 }, { name: "idx_appId_todoListId" });
```

---

## 🔄 MIGRATION STRATEGY

### Migration từ Non-Multi-Tenant sang Multi-Tenant

**Bước 1: Thêm fields mới (Backward Compatible)**

```javascript
// Update TodoLists: Thêm appId = null
db.todoLists.updateMany(
  { $or: [{ appId: null }, { appId: { $exists: false } }] },
  { $set: { appId: null } }
);

// Update TodoItems: Thêm appId = null
db.todoItems.updateMany(
  { $or: [{ appId: null }, { appId: { $exists: false } }] },
  { $set: { appId: null } }
);

// Update UserApps: Set default tenant mode
db.userApps.updateMany(
  { $or: [{ tenantMode: { $exists: false } }] },
  { $set: { 
    tenantMode: "shared",
    databaseName: null 
  }}
);
```

**Bước 2: Create Indexes**

```javascript
// Run index creation script
// (Xem file CreateMultiTenantIndexes.md)
```

**Bước 3: Verify Migration**

```javascript
// Kiểm tra data
db.todoLists.find({ appId: null }).count();
db.todoItems.find({ appId: null }).count();
db.userApps.find({ tenantMode: "shared" }).count();

// Kiểm tra indexes
db.todoLists.getIndexes();
db.todoItems.getIndexes();
db.userApps.getIndexes();
```

---

## 💡 USE CASES & BEST PRACTICES

### Use Case 1: Small Personal App
**Recommendation:** Shared Mode

```
Lý do:
- ✅ Ít data, không cần isolated database
- ✅ Tiết kiệm tài nguyên server
- ✅ Dễ backup (chỉ cần backup main DB)
- ✅ Simple queries
```

### Use Case 2: Enterprise App with Compliance
**Recommendation:** Isolated Mode

```
Lý do:
- ✅ Bảo mật cao (physical database isolation)
- ✅ Compliance requirements (GDPR, HIPAA)
- ✅ Có thể encrypt database riêng
- ✅ Dễ export data cho specific customer
```

### Use Case 3: Multi-User Collaboration App
**Recommendation:** Shared Mode → Isolated Mode (khi scale)

```
Strategy:
1. Start với Shared Mode
2. Monitor database size và performance
3. Khi data > 10,000 records:
   → Switch to Isolated Mode
```

### Best Practices:

#### 1. Always validate appId
```csharp
if (!string.IsNullOrWhiteSpace(appId))
{
    if (!_securityHelper.IsValidObjectId(appId))
    {
        return BadRequest("Invalid AppId format");
    }
    
    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
    {
        return Forbid("Access denied");
    }
}
```

#### 2. Use indexes efficiently
```csharp
// Good: Query với index
var filter = Builders<TodoList>.Filter.And(
    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId),
    Builders<TodoList>.Filter.Eq(list => list.AppId, appId)
);

// Bad: Query without index
var lists = await _mongoContext.TodoLists
    .AsQueryable()
    .Where(l => l.AppUserId == userId && l.AppId == appId)
    .ToListAsync();
```

#### 3. Handle null appId (Backward Compatible)
```csharp
// Hỗ trợ cả data cũ (appId = null) và data mới (appId != null)
FilterDefinition<TodoList> filter;

if (!string.IsNullOrWhiteSpace(appId))
{
    filter = Builders<TodoList>.Filter.Eq(list => list.AppId, appId);
}
else
{
    // Query data cũ (appId = null) hoặc tất cả lists của user
    filter = Builders<TodoList>.Filter.And(
        Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId),
        Builders<TodoList>.Filter.Or(
            Builders<TodoList>.Filter.Eq(list => list.AppId, null),
            Builders<TodoList>.Filter.Exists(list => list.AppId, false)
        )
    );
}
```

#### 4. Monitor database growth
```csharp
// Implement monitoring service
public class TenantMonitoringService
{
    public async Task<DatabaseStats> GetDatabaseStatsAsync(string databaseName)
    {
        var db = _mongoClient.GetDatabase(databaseName);
        var stats = await db.RunCommandAsync<BsonDocument>(
            new BsonDocument("dbStats", 1)
        );
        
        return new DatabaseStats
        {
            DataSize = stats["dataSize"].ToInt64(),
            StorageSize = stats["storageSize"].ToInt64(),
            IndexSize = stats["indexSize"].ToInt64(),
            Collections = stats["collections"].ToInt32()
        };
    }
}
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Query Optimization

**Shared Mode:**
```csharp
// Tối ưu: Sử dụng compound index (appUserId, appId)
var filter = Builders<TodoList>.Filter.And(
    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId),
    Builders<TodoList>.Filter.Eq(list => list.AppId, appId)
);

// MongoDB sẽ sử dụng index: idx_appUserId_appId
var lists = await _mongoContext.TodoLists
    .Find(filter)
    .ToListAsync();
```

**Isolated Mode:**
```csharp
// Tối ưu: Query trực tiếp trong isolated DB (không cần filter userId)
var isolatedDb = _mongoClient.GetDatabase(app.DatabaseName);
var todolists = isolatedDb.GetCollection<TodoList>("todoLists");

var filter = Builders<TodoList>.Filter.Eq(list => list.AppId, appId);
var lists = await todolists.Find(filter).ToListAsync();
```

### Caching Strategy

```csharp
// Cache UserApp info để tránh query nhiều lần
public class TenantCacheService
{
    private readonly IMemoryCache _cache;
    
    public async Task<UserApp?> GetUserAppCachedAsync(string appId)
    {
        var cacheKey = $"userapp:{appId}";
        
        if (!_cache.TryGetValue(cacheKey, out UserApp? app))
        {
            app = await _mongoContext.UserApps
                .Find(a => a.Id == appId)
                .FirstOrDefaultAsync();
            
            if (app != null)
            {
                _cache.Set(cacheKey, app, TimeSpan.FromMinutes(10));
            }
        }
        
        return app;
    }
}
```

---

## 🔧 TROUBLESHOOTING

### Problem 1: "Access Denied" khi đã login

**Triệu chứng:**
```
403 Forbidden: "You don't have access to this app"
```

**Nguyên nhân:**
- appId không thuộc về user hiện tại
- appId format không hợp lệ

**Giải pháp:**
```csharp
// Debug bằng cách log
_logger.LogInformation("Verifying ownership: appId={AppId}, userId={UserId}", 
    appId, userId);

// Check trong database
db.userApps.findOne({ _id: ObjectId("abc123") });
// Verify appUserId có match với userId trong JWT token không
```

### Problem 2: Data không hiển thị sau khi switch to Isolated Mode

**Triệu chứng:**
- Switch thành công nhưng không thấy data

**Nguyên nhân:**
- Migration chưa chạy hoặc failed
- App code vẫn query trong main DB

**Giải pháp:**
```csharp
// 1. Verify migration đã chạy
var stats = await _tenantDatabaseService.GetMigrationStatusAsync(appId);
Console.WriteLine($"Lists migrated: {stats.TodoListsMigrated}");
Console.WriteLine($"Items migrated: {stats.TodoItemsMigrated}");

// 2. Verify app config
var app = await _mongoContext.UserApps.Find(a => a.Id == appId).FirstOrDefaultAsync();
Console.WriteLine($"TenantMode: {app.TenantMode}");
Console.WriteLine($"DatabaseName: {app.DatabaseName}");

// 3. Manually query isolated DB
var isolatedDb = _mongoClient.GetDatabase(app.DatabaseName);
var count = await isolatedDb.GetCollection<TodoList>("todoLists")
    .CountDocumentsAsync(Builders<TodoList>.Filter.Empty);
Console.WriteLine($"Lists in isolated DB: {count}");
```

### Problem 3: Slow Queries

**Triệu chứng:**
- API response chậm (> 1 second)

**Nguyên nhân:**
- Missing indexes
- Query không tối ưu

**Giải pháp:**
```javascript
// 1. Check indexes
db.todoLists.getIndexes();
db.todoItems.getIndexes();

// 2. Analyze query execution
db.todoLists.find({ appUserId: "user123", appId: "app456" }).explain("executionStats");

// 3. Create missing indexes
db.todoLists.createIndex({ appUserId: 1, appId: 1 }, { background: true });
```

---

## 📈 MONITORING & METRICS

### Key Metrics to Track:

```csharp
public class TenantMetrics
{
    // 1. Number of apps per tenant mode
    public int SharedModeApps { get; set; }
    public int IsolatedModeApps { get; set; }
    
    // 2. Database sizes
    public long MainDatabaseSize { get; set; }
    public Dictionary<string, long> IsolatedDatabaseSizes { get; set; }
    
    // 3. Query performance
    public double AverageQueryTime { get; set; }
    public int SlowQueries { get; set; } // > 1 second
    
    // 4. Migration stats
    public int PendingMigrations { get; set; }
    public int CompletedMigrations { get; set; }
}
```

### Monitoring Endpoints:

```csharp
[HttpGet("api/admin/tenant-metrics")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<TenantMetrics>> GetTenantMetrics()
{
    var metrics = new TenantMetrics
    {
        SharedModeApps = await _mongoContext.UserApps
            .CountDocumentsAsync(a => a.TenantMode == "shared"),
        
        IsolatedModeApps = await _mongoContext.UserApps
            .CountDocumentsAsync(a => a.TenantMode == "isolated"),
        
        MainDatabaseSize = await GetDatabaseSizeAsync("nexus")
    };
    
    return Ok(metrics);
}
```

---

## 🎓 KẾT LUẬN

### Ưu điểm của kiến trúc Multi-Tenant:

✅ **Flexibility**: Cho phép chọn giữa shared và isolated mode  
✅ **Scalability**: Dễ scale bằng cách tạo isolated databases  
✅ **Security**: Physical isolation cho isolated mode  
✅ **Cost-effective**: Shared mode tiết kiệm tài nguyên  
✅ **Backward Compatible**: Hỗ trợ data cũ (appId = null)  
✅ **Migration Support**: Có thể switch mode dễ dàng  

### So sánh Shared vs Isolated:

| Tiêu chí | Shared Mode | Isolated Mode |
|----------|-------------|---------------|
| **Bảo mật** | ⭐⭐⭐ (Logic isolation) | ⭐⭐⭐⭐⭐ (Physical isolation) |
| **Performance** | ⭐⭐⭐⭐ (Single DB) | ⭐⭐⭐⭐⭐ (Dedicated DB) |
| **Chi phí** | ⭐⭐⭐⭐⭐ (Rất rẻ) | ⭐⭐⭐ (Tốn tài nguyên hơn) |
| **Backup** | ⭐⭐⭐⭐⭐ (Single backup) | ⭐⭐⭐ (Multiple backups) |
| **Compliance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (Easy data export) |
| **Scalability** | ⭐⭐⭐ (Limited) | ⭐⭐⭐⭐⭐ (Easy horizontal scale) |

### Khi nào nên chọn gì?

**Chọn Shared Mode nếu:**
- 🎯 App nhỏ, cá nhân hoặc team nhỏ
- 🎯 Data size < 10,000 records
- 🎯 Không có compliance requirements đặc biệt
- 🎯 Muốn tiết kiệm chi phí

**Chọn Isolated Mode nếu:**
- 🎯 Enterprise app với nhiều users
- 🎯 Data size > 10,000 records
- 🎯 Cần comply với GDPR, HIPAA, etc.
- 🎯 Muốn performance tối ưu
- 🎯 Có budget cho infrastructure

---

**Ngày tạo**: 18/12/2025  
**Phiên bản**: 1.0  
**Author**: NEXUS-403 Team
