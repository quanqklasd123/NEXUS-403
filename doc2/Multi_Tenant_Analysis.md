# Multi-Tenant Architecture Analysis & Implementation Plan

## 📊 Hiện trạng dự án

### Cấu trúc hiện tại
Dự án hiện tại đang sử dụng **Single-tenant với User Isolation**:

- **Database**: MongoDB Atlas (Shared Database, Shared Collections)
- **Data Isolation**: Phân biệt bằng `AppUserId` trong mỗi document
- **Collections có User Ownership**:
  - `projects` → `appUserId` (string/ObjectId)
  - `userApps` → `appUserId` (string/ObjectId)
  - `todoLists` → `appUserId` (string/ObjectId)
  - `todoItems` → thông qua `todoLists` → `appUserId` (indirect)
- **Technology Stack**: MongoDB.Driver với C# MongoDB Driver

### Cách hoạt động hiện tại
```csharp
// ProjectsController.cs
private string GetCurrentUserId()
{
    return User.FindFirstValue(ClaimTypes.NameIdentifier);
}

[HttpGet]
public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
{
    var userId = GetCurrentUserId();
    var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
    var projects = await _mongoContext.Projects
        .Find(filter)
        .ToListAsync();
    return Ok(projects);
}
```

**Ưu điểm:**
- ✅ Đơn giản, dễ triển khai
- ✅ Dữ liệu đã được isolate theo user
- ✅ Không cần thay đổi database structure lớn

**Nhược điểm:**
- ❌ Không hỗ trợ team/organization collaboration
- ❌ Không có khái niệm "tenant" (công ty/tổ chức)
- ❌ Khó scale cho enterprise customers

---

## 🏢 Multi-Tenant Architecture Options

### Option 1: Shared Database, Shared Schema với TenantId (Recommended)

**Cách hoạt động:**
- Thêm `TenantId` vào mỗi entity
- Users thuộc về một Tenant (Organization)
- Filter data theo `TenantId` thay vì chỉ `AppUserId`

**MongoDB Collections Schema:**
```javascript
// Collection: tenants
{
  _id: ObjectId("..."),
  name: "Acme Corporation",
  subdomain: "acme",  // Optional: tenant1.nexus.com
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}

// Collection: users (AppUser)
{
  _id: ObjectId("..."),
  userName: "john@acme.com",
  email: "john@acme.com",
  tenantId: ObjectId("..."),  // Reference to tenants collection
  // ... other identity fields
}

// Collection: projects
{
  _id: ObjectId("..."),
  name: "My Project",
  appUserId: ObjectId("..."),  // User who created
  tenantId: ObjectId("..."),    // Tenant that owns this
  // ... other fields
}

// Tương tự cho userApps, todoLists, etc.
```

**Model Changes:**
```csharp
// Models/Tenant.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class Tenant
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("name")]
    [Required]
    public string Name { get; set; }

    [BsonElement("subdomain")]
    public string? Subdomain { get; set; }  // Optional: tenant1.nexus.com

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// Models/MongoIdentity/AppUser.cs
[BsonElement("tenantId")]
public string? TenantId { get; set; }  // Reference to Tenant (ObjectId as string)

// Models/Project.cs
[BsonElement("tenantId")]
public string? TenantId { get; set; }  // Reference to Tenant (ObjectId as string)

// Giữ nguyên AppUserId cho user ownership
[BsonElement("appUserId")]
public string AppUserId { get; set; }
```

**Controller Changes:**
```csharp
// ProjectsController.cs
private async Task<string?> GetCurrentTenantIdAsync()
{
    var userId = GetCurrentUserId();
    var userFilter = Builders<AppUser>.Filter.Eq(u => u.Id, userId);
    var user = await _mongoContext.Users.Find(userFilter).FirstOrDefaultAsync();
    return user?.TenantId;
}

[HttpGet]
public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
{
    var userId = GetCurrentUserId();
    var tenantId = await GetCurrentTenantIdAsync();
    
    FilterDefinition<Project> filter;
    
    // Filter theo tenant nếu user thuộc tenant
    if (!string.IsNullOrEmpty(tenantId))
    {
        filter = Builders<Project>.Filter.Eq(p => p.TenantId, tenantId);
    }
    else
    {
        // Personal projects (không thuộc tenant nào)
        filter = Builders<Project>.Filter.And(
            Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
            Builders<Project>.Filter.Eq(p => p.TenantId, (string?)null)
        );
    }
    
    var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
    var projects = await _mongoContext.Projects
        .Find(filter)
        .Sort(sort)
        .ToListAsync();
    
    return Ok(projects);
}
```

**Ưu điểm:**
- ✅ Dễ migrate từ cấu trúc hiện tại
- ✅ Hỗ trợ cả personal và organization data
- ✅ Có thể share data trong cùng tenant
- ✅ Không cần separate database

**Nhược điểm:**
- ⚠️ Cần thêm `TenantId` vào mọi query
- ⚠️ Cần migration data hiện có

---

### Option 2: Organization-Based Multi-Tenant

**Cách hoạt động:**
- Tạo concept "Organization" (tương tự Tenant)
- Users có thể thuộc nhiều Organizations (many-to-many)
- Projects/Apps có thể share trong Organization

**MongoDB Collections Schema:**
```javascript
// Collection: organizations
{
  _id: ObjectId("..."),
  name: "Acme Corporation",
  subdomain: "acme",
  createdAt: ISODate("2024-01-01T00:00:00Z")
}

// Collection: userOrganizations (Many-to-Many)
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  organizationId: ObjectId("..."),
  role: "Owner" | "Admin" | "Member",
  joinedAt: ISODate("2024-01-01T00:00:00Z")
}

// Collection: projects
{
  _id: ObjectId("..."),
  name: "My Project",
  organizationId: ObjectId("..."),  // Reference to organizations
  // ... other fields
}
```

**Ưu điểm:**
- ✅ Users có thể thuộc nhiều organizations
- ✅ Role-based access control (RBAC)
- ✅ Flexible collaboration

**Nhược điểm:**
- ⚠️ Phức tạp hơn Option 1
- ⚠️ Cần quản lý permissions phức tạp

---

### Option 3: Separate Database per Tenant (MongoDB)

**Cách hoạt động:**
- Mỗi tenant có database riêng trong MongoDB cluster
- Dynamic database selection dựa trên tenant
- Ví dụ: `nexus_tenant1`, `nexus_tenant2`, `nexus_tenant3`

**Implementation:**
```csharp
// MongoDbContext với dynamic database
public class TenantMongoDbContext
{
    private readonly IMongoClient _client;
    private readonly string _tenantId;

    public TenantMongoDbContext(IMongoClient client, string tenantId)
    {
        _client = client;
        _tenantId = tenantId;
    }

    private IMongoDatabase Database => _client.GetDatabase($"nexus_{_tenantId}");

    public IMongoCollection<Project> Projects => Database.GetCollection<Project>("projects");
    // ... other collections
}
```

**Ưu điểm:**
- ✅ Data isolation hoàn toàn
- ✅ Dễ backup/restore từng tenant
- ✅ Compliance tốt (GDPR, HIPAA)
- ✅ Có thể scale từng tenant độc lập

**Nhược điểm:**
- ❌ Phức tạp về infrastructure
- ❌ Khó quản lý nhiều databases
- ❌ Migration phức tạp
- ❌ Cross-tenant queries khó khăn

---

## 🎯 Đề xuất: Option 1 - Shared Database với TenantId

### Lý do chọn Option 1:
1. **Dễ migrate**: Có thể giữ nguyên cấu trúc hiện tại, chỉ thêm `TenantId`
2. **Backward compatible**: Users không thuộc tenant vẫn hoạt động (personal mode)
3. **Scalable**: Có thể nâng cấp lên Option 2 sau
4. **Cost-effective**: Không cần nhiều database

### Implementation Steps:

#### Step 1: Tạo Tenant Model
```csharp
// Models/Tenant.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    public class Tenant
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        [Required]
        public string Name { get; set; }

        [BsonElement("subdomain")]
        public string? Subdomain { get; set; }  // Optional: tenant1.nexus.com

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

#### Step 2: Update Models
- Thêm `TenantId` (string, nullable) vào `AppUser`, `Project`, `UserApp`, `TodoList`
- Sử dụng `[BsonElement("tenantId")]` attribute

#### Step 3: Update MongoDbContext
```csharp
// Data/MongoDbContext.cs
public IMongoCollection<Tenant> Tenants => GetCollection<Tenant>("tenants");
```

#### Step 4: Update Controllers
- Thêm helper method `GetCurrentTenantIdAsync()`
- Update queries để filter theo `TenantId` sử dụng MongoDB filters
- Giữ backward compatibility cho personal users

#### Step 5: Tenant Management APIs
```csharp
// Controllers/TenantsController.cs
[HttpPost]  // Tạo tenant mới
public async Task<ActionResult<TenantDTO>> CreateTenant(CreateTenantDTO dto)
{
    var tenant = new Tenant
    {
        Name = dto.Name,
        Subdomain = dto.Subdomain,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };
    await _mongoContext.Tenants.InsertOneAsync(tenant);
    
    // Assign current user as owner
    var userId = GetCurrentUserId();
    var userUpdate = Builders<AppUser>.Update.Set(u => u.TenantId, tenant.Id);
    await _mongoContext.Users.UpdateOneAsync(
        Builders<AppUser>.Filter.Eq(u => u.Id, userId),
        userUpdate
    );
    
    return Ok(tenant);
}

[HttpGet]   // Lấy tenant của user
public async Task<ActionResult<TenantDTO>> GetUserTenant()
{
    var userId = GetCurrentUserId();
    var user = await _mongoContext.Users
        .Find(Builders<AppUser>.Filter.Eq(u => u.Id, userId))
        .FirstOrDefaultAsync();
    
    if (string.IsNullOrEmpty(user?.TenantId))
        return NotFound();
    
    var tenant = await _mongoContext.Tenants
        .Find(Builders<Tenant>.Filter.Eq(t => t.Id, user.TenantId))
        .FirstOrDefaultAsync();
    
    return Ok(tenant);
}

[HttpPut("{id}")]  // Update tenant
[HttpPost("{id}/users")]  // Thêm user vào tenant
[HttpDelete("{id}/users/{userId}")]  // Xóa user khỏi tenant
```

#### Step 6: Data Migration Script (MongoDB)
```csharp
// Scripts/MigrateToMultiTenant.cs
// Chạy một lần để đảm bảo tất cả documents có tenantId field
// MongoDB không cần migration như SQL, nhưng cần đảm bảo field tồn tại

// Option 1: Bulk update để thêm tenantId = null cho existing documents
var projectsUpdate = Builders<Project>.Update.SetOnInsert(p => p.TenantId, (string?)null);
await _mongoContext.Projects.UpdateManyAsync(
    Builders<Project>.Filter.Eq(p => p.TenantId, (string?)null),
    projectsUpdate
);

// Option 2: Script để migrate personal projects to default tenant (optional)
```

---

## 🔐 Security Considerations

### Data Isolation
- **Query Filtering**: Luôn filter theo `TenantId` trong mọi query
- **Authorization**: Kiểm tra user có thuộc tenant không
- **Cross-tenant Prevention**: Không cho phép access data của tenant khác

### Best Practices
```csharp
// ✅ GOOD: Always filter by TenantId
var filter = Builders<Project>.Filter.Eq(p => p.TenantId, currentTenantId);
var projects = await _mongoContext.Projects
    .Find(filter)
    .ToListAsync();

// ❌ BAD: Missing TenantId filter
var projects = await _mongoContext.Projects
    .Find(_ => true)
    .ToListAsync();
```

### Indexes cho Performance
```csharp
// Tạo indexes cho TenantId để query nhanh hơn
var indexKeys = Builders<Project>.IndexKeys.Ascending(p => p.TenantId);
var indexOptions = new CreateIndexOptions { Name = "TenantId_Index" };
await _mongoContext.Projects.Indexes.CreateOneAsync(
    new CreateIndexModel<Project>(indexKeys, indexOptions)
);

// Compound index cho TenantId + AppUserId
var compoundIndex = Builders<Project>.IndexKeys
    .Ascending(p => p.TenantId)
    .Ascending(p => p.AppUserId);
await _mongoContext.Projects.Indexes.CreateOneAsync(
    new CreateIndexModel<Project>(compoundIndex, new CreateIndexOptions { Name = "TenantId_AppUserId_Index" })
);
```

---

## 📈 Migration Strategy

### Phase 1: Add Tenant Support (Non-breaking)
1. Thêm `Tenant` collection và model
2. Thêm `TenantId` field (nullable string) vào các models
3. Existing documents: `TenantId = null` (personal mode)
4. Update queries để support cả personal và tenant mode
5. Tạo indexes cho `TenantId` để optimize queries

### Phase 2: Tenant Creation
1. Allow users to create/join tenants
2. UI để manage tenants
3. Invite users to tenant

### Phase 3: Data Migration (Optional)
1. Script để migrate existing personal projects to default tenant:
```csharp
// Tạo default tenant cho user
var defaultTenant = new Tenant
{
    Name = $"{user.UserName}'s Organization",
    CreatedAt = DateTime.UtcNow
};
await _mongoContext.Tenants.InsertOneAsync(defaultTenant);

// Update user's TenantId
var userUpdate = Builders<AppUser>.Update.Set(u => u.TenantId, defaultTenant.Id);
await _mongoContext.Users.UpdateOneAsync(
    Builders<AppUser>.Filter.Eq(u => u.Id, userId),
    userUpdate
);

// Update all user's projects
var projectUpdate = Builders<Project>.Update.Set(p => p.TenantId, defaultTenant.Id);
await _mongoContext.Projects.UpdateManyAsync(
    Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
    projectUpdate
);
```
2. Or keep as personal projects (TenantId = null)

---

## 🎨 Frontend Changes

### Tenant Selection
```javascript
// Context/TenantContext.jsx
const TenantContext = createContext();

export function TenantProvider({ children }) {
    const [currentTenant, setCurrentTenant] = useState(null);
    const [userTenants, setUserTenants] = useState([]);
    
    // Load tenants của user
    useEffect(() => {
        apiService.getUserTenants().then(setUserTenants);
    }, []);
    
    return (
        <TenantContext.Provider value={{ currentTenant, setCurrentTenant, userTenants }}>
            {children}
        </TenantContext.Provider>
    );
}
```

### API Service Updates
```javascript
// services/apiService.js
export const tenantService = {
    getTenants: () => apiClient.get('/tenants'),
    createTenant: (data) => apiClient.post('/tenants', data),
    getTenant: (id) => apiClient.get(`/tenants/${id}`),
    updateTenant: (id, data) => apiClient.put(`/tenants/${id}`, data),
    addUserToTenant: (tenantId, userId) => apiClient.post(`/tenants/${tenantId}/users`, { userId }),
    removeUserFromTenant: (tenantId, userId) => apiClient.delete(`/tenants/${tenantId}/users/${userId}`),
};
```

---

## ✅ Kết luận

**Có, dự án của bạn HOÀN TOÀN có thể sử dụng multi-tenant!**

### Lợi ích:
1. ✅ **Team Collaboration**: Nhiều users trong cùng tenant có thể share projects/apps
2. ✅ **Enterprise Ready**: Phù hợp cho enterprise customers
3. ✅ **Scalable**: Dễ mở rộng sau này
4. ✅ **Backward Compatible**: Không breaking existing functionality

### Recommended Approach:
- **Start với Option 1** (Shared DB, Shared Schema với TenantId)
- **Có thể nâng cấp lên Option 2** (Organization-based) nếu cần
- **Migration path rõ ràng** từ cấu trúc hiện tại

### Next Steps:
1. Tạo `Tenant` model và migration
2. Update existing models với `TenantId`
3. Update controllers để filter theo tenant
4. Tạo Tenant management APIs
5. Update frontend để support tenant selection

---

## 🔧 MongoDB-Specific Implementation Details

### Collection Naming
- `tenants` - Tenant/Organization data
- `users` - User accounts (đã có sẵn)
- `projects` - Projects (cần thêm `tenantId`)
- `userApps` - User apps (cần thêm `tenantId`)
- `todoLists` - Todo lists (cần thêm `tenantId`)
- `todoItems` - Todo items (có thể cần thêm `tenantId` hoặc inherit từ TodoList)

### Query Patterns
```csharp
// Pattern 1: Filter by TenantId only
var filter = Builders<Project>.Filter.Eq(p => p.TenantId, tenantId);
var projects = await _mongoContext.Projects.Find(filter).ToListAsync();

// Pattern 2: Filter by TenantId AND AppUserId (for personal items in tenant)
var filter = Builders<Project>.Filter.And(
    Builders<Project>.Filter.Eq(p => p.TenantId, tenantId),
    Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
);

// Pattern 3: Personal mode (no tenant)
var filter = Builders<Project>.Filter.And(
    Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
    Builders<Project>.Filter.Eq(p => p.TenantId, (string?)null)
);
```

### Aggregation Pipeline Example
```csharp
// Get projects with tenant info
var pipeline = new BsonDocument[]
{
    new BsonDocument("$match", new BsonDocument("tenantId", tenantId)),
    new BsonDocument("$lookup", new BsonDocument
    {
        { "from", "tenants" },
        { "localField", "tenantId" },
        { "foreignField", "_id" },
        { "as", "tenant" }
    }),
    new BsonDocument("$unwind", new BsonDocument
    {
        { "path", "$tenant" },
        { "preserveNullAndEmptyArrays", true }
    })
};
var results = await _mongoContext.Projects.Aggregate<Project>(pipeline).ToListAsync();
```

## 📚 References

- [Multi-Tenant SaaS Architecture Patterns](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
- [MongoDB Multi-Tenant Patterns](https://www.mongodb.com/docs/manual/core/data-modeling-operations/)
- [MongoDB C# Driver Documentation](https://www.mongodb.com/docs/drivers/csharp/)
- [ASP.NET Core Multi-Tenancy](https://www.finbuckle.com/MultiTenant)

