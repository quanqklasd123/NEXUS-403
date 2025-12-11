# Multi-Tenant Architecture Analysis & Implementation Plan

## 📊 Hiện trạng dự án

### Cấu trúc hiện tại
Dự án hiện tại đang sử dụng **Single-tenant với User Isolation**:

- **Database**: Shared Database, Shared Schema
- **Data Isolation**: Phân biệt bằng `AppUserId` trong mỗi entity
- **Models có User Ownership**:
  - `Project` → `AppUserId`
  - `UserApp` → `AppUserId`
  - `TodoList` → `AppUserId`
  - `TodoItem` → `TodoList` → `AppUserId` (indirect)
  - `GoogleCalendarToken` → `AppUserId`

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
    var projects = await _context.Projects
        .Where(p => p.AppUserId == userId)  // Filter theo user
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

**Database Schema:**
```sql
-- Thêm bảng Tenant/Organization
CREATE TABLE Tenants (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(255) NOT NULL,
    Subdomain NVARCHAR(100) UNIQUE,  -- tenant1.nexus.com
    CreatedAt DATETIME,
    UpdatedAt DATETIME
);

-- Thêm TenantId vào AppUser
ALTER TABLE AspNetUsers ADD TenantId INT NULL;
ALTER TABLE AspNetUsers ADD FOREIGN KEY (TenantId) REFERENCES Tenants(Id);

-- Thêm TenantId vào các bảng
ALTER TABLE Projects ADD TenantId INT NULL;
ALTER TABLE UserApps ADD TenantId INT NULL;
ALTER TABLE TodoLists ADD TenantId INT NULL;
-- ... các bảng khác
```

**Model Changes:**
```csharp
// Models/Tenant.cs
public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Subdomain { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<AppUser> Users { get; set; }
    public ICollection<Project> Projects { get; set; }
}

// Models/AppUser.cs
public class AppUser : IdentityUser
{
    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<TodoList> TodoLists { get; set; }
}

// Models/Project.cs
public class Project
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? JsonData { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // User ownership (người tạo)
    public string AppUserId { get; set; }
    public AppUser AppUser { get; set; }
    
    // Tenant ownership (tổ chức sở hữu)
    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}
```

**Controller Changes:**
```csharp
// ProjectsController.cs
private int? GetCurrentTenantId()
{
    var userId = GetCurrentUserId();
    var user = _context.Users.FirstOrDefault(u => u.Id == userId);
    return user?.TenantId;
}

[HttpGet]
public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
{
    var userId = GetCurrentUserId();
    var tenantId = GetCurrentTenantId();
    
    var query = _context.Projects.AsQueryable();
    
    // Filter theo tenant nếu user thuộc tenant
    if (tenantId.HasValue)
    {
        query = query.Where(p => p.TenantId == tenantId);
    }
    else
    {
        // Personal projects (không thuộc tenant nào)
        query = query.Where(p => p.AppUserId == userId && p.TenantId == null);
    }
    
    var projects = await query
        .OrderByDescending(p => p.CreatedAt)
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

**Database Schema:**
```sql
CREATE TABLE Organizations (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(255) NOT NULL,
    Subdomain NVARCHAR(100) UNIQUE,
    CreatedAt DATETIME
);

-- Many-to-Many: Users ↔ Organizations
CREATE TABLE UserOrganizations (
    UserId NVARCHAR(450),
    OrganizationId INT,
    Role NVARCHAR(50),  -- 'Owner', 'Admin', 'Member'
    PRIMARY KEY (UserId, OrganizationId)
);

-- Projects thuộc về Organization
ALTER TABLE Projects ADD OrganizationId INT NULL;
```

**Ưu điểm:**
- ✅ Users có thể thuộc nhiều organizations
- ✅ Role-based access control (RBAC)
- ✅ Flexible collaboration

**Nhược điểm:**
- ⚠️ Phức tạp hơn Option 1
- ⚠️ Cần quản lý permissions phức tạp

---

### Option 3: Separate Database per Tenant

**Cách hoạt động:**
- Mỗi tenant có database riêng
- Dynamic connection string dựa trên tenant

**Ưu điểm:**
- ✅ Data isolation hoàn toàn
- ✅ Dễ backup/restore từng tenant
- ✅ Compliance tốt (GDPR, HIPAA)

**Nhược điểm:**
- ❌ Phức tạp về infrastructure
- ❌ Khó scale
- ❌ Migration phức tạp

---

## 🎯 Đề xuất: Option 1 - Shared Database với TenantId

### Lý do chọn Option 1:
1. **Dễ migrate**: Có thể giữ nguyên cấu trúc hiện tại, chỉ thêm `TenantId`
2. **Backward compatible**: Users không thuộc tenant vẫn hoạt động (personal mode)
3. **Scalable**: Có thể nâng cấp lên Option 2 sau
4. **Cost-effective**: Không cần nhiều database

### Implementation Steps:

#### Step 1: Tạo Tenant Model và Migration
```csharp
// Models/Tenant.cs
public class Tenant
{
    public int Id { get; set; }
    [Required]
    [StringLength(255)]
    public string Name { get; set; }
    
    [StringLength(100)]
    public string? Subdomain { get; set; }  // Optional: tenant1.nexus.com
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<UserApp> UserApps { get; set; } = new List<UserApp>();
}
```

#### Step 2: Update Models
- Thêm `TenantId` vào `AppUser`, `Project`, `UserApp`, `TodoList`
- Thêm navigation property `Tenant`

#### Step 3: Create Migration
```bash
dotnet ef migrations add AddTenantSupport
dotnet ef database update
```

#### Step 4: Update Controllers
- Thêm helper method `GetCurrentTenantId()`
- Update queries để filter theo `TenantId`
- Giữ backward compatibility cho personal users

#### Step 5: Tenant Management APIs
```csharp
// Controllers/TenantsController.cs
[HttpPost]  // Tạo tenant mới
[HttpGet]   // Lấy tenant của user
[HttpPut("{id}")]  // Update tenant
[HttpPost("{id}/users")]  // Thêm user vào tenant
[HttpDelete("{id}/users/{userId}")]  // Xóa user khỏi tenant
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
var projects = await _context.Projects
    .Where(p => p.TenantId == currentTenantId)
    .ToListAsync();

// ❌ BAD: Missing TenantId filter
var projects = await _context.Projects.ToListAsync();
```

---

## 📈 Migration Strategy

### Phase 1: Add Tenant Support (Non-breaking)
1. Thêm `Tenant` table
2. Thêm `TenantId` columns (nullable)
3. Existing data: `TenantId = null` (personal mode)
4. Update queries để support cả personal và tenant mode

### Phase 2: Tenant Creation
1. Allow users to create/join tenants
2. UI để manage tenants
3. Invite users to tenant

### Phase 3: Data Migration (Optional)
1. Migrate existing personal projects to default tenant
2. Or keep as personal projects

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

## 📚 References

- [Multi-Tenant SaaS Architecture Patterns](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
- [EF Core Multi-Tenant](https://www.thereformedprogrammer.net/ef-core-in-depth-soft-deleting-data-with-global-query-filters/)
- [ASP.NET Core Multi-Tenancy](https://www.finbuckle.com/MultiTenant)

