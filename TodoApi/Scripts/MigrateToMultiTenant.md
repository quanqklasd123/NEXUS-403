# Migration Script: Multi-Tenant Support

Script này migrate existing data để hỗ trợ multi-tenant architecture.

## Cách chạy Migration

### Option 1: Qua API Endpoint (Recommended)

**Yêu cầu:** Admin role

1. **Kiểm tra migration status:**
   ```bash
   GET /api/migration/status
   Authorization: Bearer {admin_token}
   ```

2. **Chạy migration:**
   ```bash
   POST /api/migration/run
   Authorization: Bearer {admin_token}
   ```

### Option 2: MongoDB Shell Script

Chạy script sau trong MongoDB shell hoặc MongoDB Compass:

```javascript
// 1. Update existing TodoLists
db.todoLists.updateMany(
  { $or: [{ appId: null }, { appId: { $exists: false } }] },
  { $set: { appId: null } }
);

// 2. Update existing TodoItems
db.todoItems.updateMany(
  { $or: [{ appId: null }, { appId: { $exists: false } }] },
  { $set: { appId: null } }
);

// 3. Update existing UserApps
db.userApps.updateMany(
  {
    $or: [
      { tenantMode: { $ne: "shared" } },
      { tenantMode: { $exists: false } },
      { databaseName: { $ne: null } },
      { databaseName: { $exists: false } }
    ]
  },
  {
    $set: {
      tenantMode: "shared",
      databaseName: null
    }
  }
);

// 4. Create Indexes

// todoLists indexes
db.todoLists.createIndex({ appUserId: 1, appId: 1 }, { name: "idx_appUserId_appId" });
db.todoLists.createIndex({ appId: 1 }, { name: "idx_appId" });

// todoItems indexes
db.todoItems.createIndex({ appId: 1, todoListId: 1 }, { name: "idx_appId_todoListId" });
db.todoItems.createIndex({ todoListId: 1 }, { name: "idx_todoListId" });

// userApps indexes
db.userApps.createIndex({ appUserId: 1 }, { name: "idx_appUserId" });
db.userApps.createIndex({ tenantMode: 1 }, { name: "idx_tenantMode" });
```

### Option 3: C# Console Command (Future)

Có thể tạo console command để chạy migration từ command line:

```bash
dotnet run -- migration run
```

## Migration Steps

### 1. Update TodoLists
- Set `AppId = null` cho tất cả existing records
- Giữ nguyên `AppUserId`
- **Idempotent:** Chỉ update records chưa có AppId hoặc AppId = null

### 2. Update TodoItems
- Set `AppId = null` cho tất cả existing records
- Giữ nguyên `TodoListId`
- **Idempotent:** Chỉ update records chưa có AppId hoặc AppId = null

### 3. Update UserApps
- Set `TenantMode = "shared"` cho tất cả existing records
- Set `DatabaseName = null`
- **Idempotent:** Chỉ update records có TenantMode != "shared" hoặc DatabaseName != null

### 4. Create Indexes
- **todoLists:**
  - Compound index: `(appUserId, appId)`
  - Index: `appId`
- **todoItems:**
  - Compound index: `(appId, todoListId)`
  - Index: `todoListId`
- **userApps:**
  - Index: `appUserId`
  - Index: `tenantMode`

**Idempotent:** Indexes sẽ được tạo lại nếu chưa tồn tại (MongoDB sẽ bỏ qua nếu đã tồn tại)

## Verification

Sau khi chạy migration, verify bằng cách:

1. **Check migration status:**
   ```bash
   GET /api/migration/status
   ```

2. **Verify data:**
   ```javascript
   // Kiểm tra TodoLists
   db.todoLists.find({ appId: null }).count();
   
   // Kiểm tra TodoItems
   db.todoItems.find({ appId: null }).count();
   
   // Kiểm tra UserApps
   db.userApps.find({ tenantMode: "shared", databaseName: null }).count();
   
   // Kiểm tra indexes
   db.todoLists.getIndexes();
   db.todoItems.getIndexes();
   db.userApps.getIndexes();
   ```

## Rollback

Nếu cần rollback (không khuyến nghị):

```javascript
// Xóa AppId field (optional - không cần thiết vì null là backward compatible)
// db.todoLists.updateMany({}, { $unset: { appId: "" } });
// db.todoItems.updateMany({}, { $unset: { appId: "" } });

// Xóa TenantMode và DatabaseName fields (optional)
// db.userApps.updateMany({}, { $unset: { tenantMode: "", databaseName: "" } });

// Xóa indexes (optional)
// db.todoLists.dropIndex("idx_appUserId_appId");
// db.todoLists.dropIndex("idx_appId");
// db.todoItems.dropIndex("idx_appId_todoListId");
// db.todoItems.dropIndex("idx_todoListId");
// db.userApps.dropIndex("idx_appUserId");
// db.userApps.dropIndex("idx_tenantMode");
```

## Notes

- **Idempotent:** Script có thể chạy nhiều lần an toàn
- **Backward Compatible:** Existing data với AppId = null vẫn hoạt động bình thường
- **No Data Loss:** Migration không xóa hoặc thay đổi dữ liệu hiện có, chỉ thêm fields mới
- **Performance:** Indexes sẽ cải thiện query performance cho multi-tenant queries

## Troubleshooting

### Lỗi: "Index already exists"
- **Giải pháp:** Bỏ qua, index đã tồn tại là OK

### Lỗi: "Collection not found"
- **Giải pháp:** Đảm bảo database đã có collections (tạo ít nhất 1 record trước)

### Migration chạy chậm
- **Giải pháp:** Bình thường với large datasets, indexes sẽ được tạo trong background
