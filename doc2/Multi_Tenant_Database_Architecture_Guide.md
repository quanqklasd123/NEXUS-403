# Hướng dẫn Xây dựng Multi-Tenant Database cho User Apps

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc Multi-Tenant](#kiến-trúc-multi-tenant)
3. [Thiết kế Database](#thiết-kế-database)
4. [Migration Strategy](#migration-strategy)
5. [Implementation Guide](#implementation-guide)
6. [Prompts cho AI Assistant](#prompts-cho-ai-assistant)

---

## 🎯 Tổng quan

### Mục tiêu
Xây dựng hệ thống database multi-tenant để mỗi **UserApp** (app của user) có thể có database riêng biệt, cho phép:
- **Data Isolation**: Dữ liệu của mỗi app hoàn toàn tách biệt
- **Scalability**: Mỗi app có thể scale độc lập
- **Customization**: Mỗi app có thể có schema riêng phù hợp với nhu cầu
- **Performance**: Tối ưu query cho từng app cụ thể

### Hiện trạng
- ✅ Hệ thống hiện tại: **Single-tenant với User Isolation**
- ✅ Tất cả data trong cùng database `NexusDb` (MongoDB Atlas)
- ✅ Phân biệt user bằng `AppUserId` trong mỗi collection
- ✅ Models: `UserApp`, `Project`, `TodoList`, `TodoItem` đều có `AppUserId`

### Mục tiêu mới
- 🎯 Mỗi `UserApp` có thể có **database riêng** (tenant database)
- 🎯 Dữ liệu app-specific (TodoList, TodoItem, etc.) được lưu trong database của app đó
- 🎯 Metadata của app (UserApp, Project) vẫn ở database chính
- 🎯 Hỗ trợ cả 2 mô hình: **Shared Database** và **Separate Database**

---

## 🏗️ Kiến trúc Multi-Tenant

### Mô hình 1: Shared Database với AppId (Recommended cho MVP)

```
┌─────────────────────────────────────────────────┐
│         MongoDB Atlas - NexusDb                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Metadata Collections (Shared)           │  │
│  │  - userApps                              │  │
│  │  - projects                              │  │
│  │  - users                                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  App-Specific Collections (Tenant Data)  │  │
│  │  - todoLists (có appId)                 │  │
│  │  - todoItems (có appId)                  │  │
│  │  - appData_{appId} (dynamic collections) │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Ưu điểm:**
- ✅ Dễ implement, không cần thay đổi connection
- ✅ Tiết kiệm tài nguyên
- ✅ Dễ quản lý và backup

**Nhược điểm:**
- ⚠️ Tất cả data trong cùng database
- ⚠️ Khó scale riêng cho từng app

### Mô hình 2: Separate Database per App (Advanced)

```
┌─────────────────────────────────────────────────┐
│         MongoDB Atlas - NexusDb (Main)          │
│  - userApps                                     │
│  - projects                                     │
│  - users                                        │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼───┐ ┌─────▼─────┐ ┌──▼────────┐
│ AppDb_001 │ │ AppDb_002 │ │ AppDb_003 │
│ (appId)   │ │ (appId)   │ │ (appId)   │
│           │ │           │ │           │
│ todoLists │ │ todoLists │ │ todoLists │
│ todoItems │ │ todoItems │ │ todoItems │
│ appData   │ │ appData   │ │ appData   │
└───────────┘ └───────────┘ └───────────┘
```

**Ưu điểm:**
- ✅ Data isolation hoàn toàn
- ✅ Scale độc lập cho từng app
- ✅ Backup/restore riêng biệt
- ✅ Custom schema cho từng app

**Nhược điểm:**
- ⚠️ Phức tạp hơn trong quản lý
- ⚠️ Tốn tài nguyên hơn
- ⚠️ Cần quản lý nhiều database connections

---

## 🗄️ Thiết kế Database

### Cấu trúc Collections

#### 1. Metadata Collections (Database chính: `NexusDb`)

**Collection: `userApps`**
```json
{
  "_id": "ObjectId",
  "name": "My Todo App",
  "icon": "📱",
  "description": "...",
  "config": "{...}",
  "source": "created|downloaded",
  "appUserId": "userId",
  "databaseName": "app_abc123",  // ← NEW: Tên database riêng (nếu dùng separate DB)
  "tenantMode": "shared|separate",  // ← NEW: Chế độ tenant
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Collection: `projects`** (giữ nguyên)
```json
{
  "_id": "ObjectId",
  "name": "Project Name",
  "appUserId": "userId",
  "jsonData": "{...}",
  // ... existing fields
}
```

#### 2. App-Specific Collections (Tenant Data)

**Option A: Shared Database với AppId**
```json
// Collection: todoLists
{
  "_id": "ObjectId",
  "name": "Shopping List",
  "appUserId": "userId",
  "appId": "userAppId",  // ← NEW: Foreign key to UserApp
  "itemIds": ["..."]
}

// Collection: todoItems
{
  "_id": "ObjectId",
  "title": "Buy milk",
  "status": 0,
  "todoListId": "listId",
  "appId": "userAppId",  // ← NEW: Foreign key to UserApp
  "appUserId": "userId"  // ← Keep for backward compatibility
}
```

**Option B: Separate Database**
- Mỗi app có database riêng: `app_{appId}` hoặc `app_{hash}`
- Collections trong database riêng: `todoLists`, `todoItems`, `appData`
- Không cần `appId` field vì đã được isolate bởi database

### Models cần cập nhật

#### UserApp Model
```csharp
public class UserApp
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    // ... existing fields ...

    /// <summary>
    /// Tên database riêng cho app (nếu tenantMode = "separate")
    /// Format: app_{appId} hoặc app_{hash}
    /// </summary>
    [BsonElement("databaseName")]
    public string? DatabaseName { get; set; }

    /// <summary>
    /// Chế độ tenant: "shared" (dùng AppId) hoặc "separate" (database riêng)
    /// </summary>
    [BsonElement("tenantMode")]
    public string TenantMode { get; set; } = "shared"; // Default: shared
}
```

#### TodoList Model
```csharp
public class TodoList
{
    // ... existing fields ...

    /// <summary>
    /// ID của UserApp mà list này thuộc về
    /// </summary>
    [BsonElement("appId")]
    public string? AppId { get; set; } // Nullable để backward compatible
}
```

#### TodoItem Model
```csharp
public class TodoItem
{
    // ... existing fields ...

    /// <summary>
    /// ID của UserApp mà item này thuộc về
    /// </summary>
    [BsonElement("appId")]
    public string? AppId { get; set; } // Nullable để backward compatible
}
```

---

## 🔄 Migration Strategy

### Phase 1: Thêm AppId vào Models (Backward Compatible)

1. **Thêm fields mới vào Models**
   - `UserApp`: `DatabaseName`, `TenantMode`
   - `TodoList`: `AppId` (nullable)
   - `TodoItem`: `AppId` (nullable)

2. **Migration Script**
   - Set `AppId` = null cho existing data (backward compatible)
   - Set `TenantMode` = "shared" cho existing UserApps
   - Existing queries vẫn hoạt động với `AppUserId`

### Phase 2: Update Controllers để hỗ trợ AppId

1. **Update Controllers**
   - Filter theo cả `AppUserId` và `AppId`
   - Khi tạo mới, tự động set `AppId` từ context

2. **Backward Compatibility**
   - Nếu `AppId` = null, chỉ filter theo `AppUserId` (old behavior)
   - Nếu `AppId` != null, filter theo cả 2 (new behavior)

### Phase 3: Implement Separate Database (Optional)

1. **Database Naming Strategy**
   - Format: `app_{appId}` hoặc `app_{hash(appId)}`
   - Lưu trong `UserApp.DatabaseName`

2. **Dynamic Database Context**
   - Tạo `AppDbContext` để connect đến database riêng
   - Middleware để tự động switch database dựa trên `appId` trong route

---

## 🛠️ Implementation Guide

### Step 1: Update Models

**File: `TodoApi/Models/UserApp.cs`**
```csharp
// Thêm vào class UserApp
[BsonElement("databaseName")]
public string? DatabaseName { get; set; }

[BsonElement("tenantMode")]
public string TenantMode { get; set; } = "shared";
```

**File: `TodoApi/Models/TodoList.cs`**
```csharp
// Thêm vào class TodoList
[BsonElement("appId")]
public string? AppId { get; set; }
```

**File: `TodoApi/Models/TodoItem.cs`**
```csharp
// Thêm vào class TodoItem
[BsonElement("appId")]
public string? AppId { get; set; }
```

### Step 2: Create AppDbContext Helper

**File: `TodoApi/Data/AppDbContext.cs` (NEW)**
```csharp
using MongoDB.Driver;
using TodoApi.Models;

namespace TodoApi.Data
{
    /// <summary>
    /// Helper class để lấy database context cho một app cụ thể
    /// </summary>
    public class AppDbContext
    {
        private readonly IMongoClient _mongoClient;
        private readonly MongoDbContext _mainContext;

        public AppDbContext(IMongoClient mongoClient, MongoDbContext mainContext)
        {
            _mongoClient = mongoClient;
            _mainContext = mainContext;
        }

        /// <summary>
        /// Lấy database context cho app (shared hoặc separate)
        /// </summary>
        public IMongoDatabase GetAppDatabase(string? appId)
        {
            if (string.IsNullOrEmpty(appId))
            {
                // Fallback về main database
                return _mainContext.Database;
            }

            // Lấy UserApp để check tenantMode
            var userApp = _mainContext.UserApps
                .Find(a => a.Id == appId)
                .FirstOrDefault();

            if (userApp == null)
            {
                return _mainContext.Database; // Fallback
            }

            // Nếu là separate database mode
            if (userApp.TenantMode == "separate" && !string.IsNullOrEmpty(userApp.DatabaseName))
            {
                return _mongoClient.GetDatabase(userApp.DatabaseName);
            }

            // Shared database mode - dùng main database
            return _mainContext.Database;
        }

        /// <summary>
        /// Lấy collection trong app database
        /// </summary>
        public IMongoCollection<T> GetAppCollection<T>(string? appId, string collectionName)
        {
            var database = GetAppDatabase(appId);
            return database.GetCollection<T>(collectionName);
        }
    }
}
```

### Step 3: Update Controllers

**File: `TodoApi/Controllers/TodoListsController.cs`**
```csharp
// Thêm vào constructor
private readonly AppDbContext _appContext;

public TodoListsController(MongoDbContext mongoContext, AppDbContext appContext)
{
    _mongoContext = mongoContext;
    _appContext = appContext;
}

// Update GET method
[HttpGet]
public async Task<ActionResult<IEnumerable<TodoListDTO>>> GetTodoLists([FromQuery] string? appId)
{
    var userId = GetCurrentUserId();
    
    // Build filter
    var filterBuilder = Builders<TodoList>.Filter;
    var filter = filterBuilder.Eq(l => l.AppUserId, userId);
    
    // Nếu có appId, filter theo appId
    if (!string.IsNullOrEmpty(appId))
    {
        filter = filterBuilder.And(
            filter,
            filterBuilder.Eq(l => l.AppId, appId)
        );
    }
    
    // Lấy collection từ app database
    var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
    var lists = await collection.Find(filter).ToListAsync();
    
    return Ok(lists.Select(l => new TodoListDTO { ... }));
}

// Update POST method
[HttpPost]
public async Task<ActionResult<TodoListDTO>> CreateTodoList(CreateTodoListDTO dto)
{
    var userId = GetCurrentUserId();
    var appId = dto.AppId; // Lấy từ DTO
    
    var list = new TodoList
    {
        Name = dto.Name,
        AppUserId = userId,
        AppId = appId, // Set AppId
        ItemIds = new List<string>()
    };
    
    var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
    await collection.InsertOneAsync(list);
    
    return CreatedAtAction(nameof(GetTodoList), new { id = list.Id }, ...);
}
```

### Step 4: Update DTOs

**File: `TodoApi/Dtos/CreateTodoListDTO.cs`**
```csharp
public class CreateTodoListDTO
{
    public string Name { get; set; }
    public string? AppId { get; set; } // ← NEW
}
```

**File: `TodoApi/Dtos/CreateTodoItemDTO.cs`**
```csharp
public class CreateTodoItemDTO
{
    public string? Title { get; set; }
    public string TodoListId { get; set; }
    public string? AppId { get; set; } // ← NEW
}
```

### Step 5: Register AppDbContext in DI

**File: `TodoApi/Program.cs`**
```csharp
// Thêm sau khi register MongoDbContext
builder.Services.AddScoped<AppDbContext>(sp =>
{
    var mongoClient = sp.GetRequiredService<IMongoClient>();
    var mongoContext = sp.GetRequiredService<MongoDbContext>();
    return new AppDbContext(mongoClient, mongoContext);
});
```

---

## 🤖 Prompts cho AI Assistant

### Prompt 1: Thêm AppId vào Models

```
Tôi muốn thêm multi-tenant support vào project. Hãy:

1. Thêm field `AppId` (nullable string) vào models:
   - TodoList.cs
   - TodoItem.cs

2. Thêm fields vào UserApp.cs:
   - DatabaseName (nullable string)
   - TenantMode (string, default = "shared")

3. Đảm bảo backward compatible (nullable fields)

4. Update các DTOs tương ứng để hỗ trợ AppId
```

### Prompt 2: Tạo AppDbContext Helper

```
Tạo class AppDbContext trong TodoApi/Data/ với các chức năng:

1. GetAppDatabase(appId): Trả về IMongoDatabase cho app
   - Nếu appId null → main database
   - Nếu TenantMode = "separate" → database riêng
   - Nếu TenantMode = "shared" → main database

2. GetAppCollection<T>(appId, collectionName): Trả về collection trong app database

3. Register trong DI container (Program.cs)
```

### Prompt 3: Update Controllers để hỗ trợ AppId

```
Update các controllers sau để hỗ trợ multi-tenant với AppId:

1. TodoListsController:
   - GET: Filter theo AppId (nếu có)
   - POST: Set AppId khi tạo mới
   - PUT/DELETE: Verify AppId match

2. TodoItemsController:
   - Tương tự TodoListsController

3. Sử dụng AppDbContext để lấy collection từ đúng database

4. Đảm bảo backward compatible (nếu AppId null, chỉ filter theo AppUserId)
```

### Prompt 4: Migration Script

```
Tạo migration script để:

1. Thêm AppId = null cho tất cả existing TodoList và TodoItem
2. Set TenantMode = "shared" cho tất cả existing UserApp
3. Tạo indexes cho AppId trong collections:
   - todoLists: index on (appUserId, appId)
   - todoItems: index on (appId, todoListId)

Script có thể chạy một lần, idempotent (có thể chạy nhiều lần an toàn)
```

### Prompt 5: Implement Separate Database Mode

```
Implement separate database mode cho UserApp:

1. Khi tạo UserApp mới với TenantMode = "separate":
   - Generate database name: app_{appId} hoặc app_{hash}
   - Tạo database mới trong MongoDB
   - Set DatabaseName trong UserApp

2. Update AppDbContext.GetAppDatabase() để:
   - Nếu TenantMode = "separate" → connect đến database riêng
   - Tự động tạo collections nếu chưa có

3. Thêm API endpoint để switch TenantMode:
   - POST /api/userapps/{id}/switch-tenant-mode
   - Migrate data từ shared → separate (nếu cần)
```

### Prompt 6: Testing Multi-Tenant

```
Tạo test cases cho multi-tenant:

1. Test shared mode:
   - Tạo TodoList với AppId
   - Verify chỉ user/app đó thấy được

2. Test separate mode:
   - Tạo UserApp với TenantMode = "separate"
   - Verify data được lưu trong database riêng

3. Test isolation:
   - User A không thể access data của User B
   - App A không thể access data của App B

4. Test backward compatibility:
   - Existing data (AppId = null) vẫn hoạt động
```

---

## 📊 Database Indexes

### Indexes cần tạo

```javascript
// MongoDB Indexes

// Collection: todoLists
db.todoLists.createIndex({ "appUserId": 1, "appId": 1 });
db.todoLists.createIndex({ "appId": 1 });

// Collection: todoItems
db.todoItems.createIndex({ "appId": 1, "todoListId": 1 });
db.todoItems.createIndex({ "todoListId": 1 });

// Collection: userApps
db.userApps.createIndex({ "appUserId": 1 });
db.userApps.createIndex({ "tenantMode": 1 });
db.userApps.createIndex({ "databaseName": 1 });
```

---

## 🔒 Security Considerations

### Data Isolation Rules

1. **Always filter by AppUserId**
   - Mọi query phải filter theo `AppUserId` từ JWT token
   - Không cho phép user access data của user khác

2. **AppId Validation**
   - Verify `AppId` thuộc về user hiện tại
   - Không cho phép set `AppId` của app khác

3. **Database Access Control**
   - Nếu dùng separate database, verify user có quyền access app đó
   - Middleware để validate app ownership

### Example Security Check

```csharp
private async Task<bool> VerifyAppOwnership(string appId, string userId)
{
    var app = await _mongoContext.UserApps
        .Find(a => a.Id == appId && a.AppUserId == userId)
        .FirstOrDefaultAsync();
    
    return app != null;
}
```

---

## 📝 Checklist Implementation

### Phase 1: Foundation
- [ ] Thêm `AppId` vào `TodoList` model
- [ ] Thêm `AppId` vào `TodoItem` model
- [ ] Thêm `DatabaseName` và `TenantMode` vào `UserApp` model
- [ ] Update DTOs với `AppId` field
- [ ] Tạo migration script để set default values

### Phase 2: AppDbContext
- [ ] Tạo `AppDbContext` class
- [ ] Implement `GetAppDatabase()` method
- [ ] Implement `GetAppCollection()` method
- [ ] Register trong DI container

### Phase 3: Controllers
- [ ] Update `TodoListsController` với AppId support
- [ ] Update `TodoItemsController` với AppId support
- [ ] Add AppId validation
- [ ] Test backward compatibility

### Phase 4: Separate Database (Optional)
- [ ] Implement database creation logic
- [ ] Update `AppDbContext` để support separate databases
- [ ] Add API để switch tenant mode
- [ ] Add data migration tool

### Phase 5: Testing & Optimization
- [ ] Create indexes
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Documentation

---

## 🚀 Next Steps

1. **Bắt đầu với Phase 1**: Thêm fields vào models (backward compatible)
2. **Test thoroughly**: Đảm bảo existing functionality không bị break
3. **Gradual rollout**: Enable multi-tenant cho new apps trước
4. **Monitor performance**: Theo dõi query performance với indexes mới
5. **Consider separate DB**: Chỉ implement khi thực sự cần thiết

---

## 📚 References

- [MongoDB Multi-Tenant Patterns](https://www.mongodb.com/docs/manual/core/multi-document-acid-transactions/)
- [ASP.NET Core Multi-Tenancy](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)
- [Database Sharding Strategies](https://www.mongodb.com/docs/manual/sharding/)

---

**Tác giả**: AI Assistant  
**Ngày tạo**: 2024  
**Version**: 1.0  
**Status**: Draft - Ready for Implementation
