# Create Multi-Tenant Indexes Script

Script này tạo indexes cho multi-tenant collections để tối ưu query performance.

## Cách chạy Index Creation

### Option 1: Qua API Endpoint (Recommended)

**Yêu cầu:** Admin role

1. **Tạo indexes cho main database:**
   ```bash
   POST /api/migration/create-indexes
   Authorization: Bearer {admin_token}
   ```

2. **Tạo indexes cho app database cụ thể:**
   ```bash
   POST /api/migration/create-indexes?databaseName=app_abc123
   Authorization: Bearer {admin_token}
   ```

3. **Tạo indexes cho tất cả app databases:**
   ```bash
   POST /api/migration/create-indexes-all-apps
   Authorization: Bearer {admin_token}
   ```

4. **Kiểm tra index status:**
   ```bash
   GET /api/migration/index-status
   GET /api/migration/index-status?databaseName=app_abc123
   Authorization: Bearer {admin_token}
   ```

### Option 2: MongoDB Shell Script

Chạy script sau trong MongoDB shell hoặc MongoDB Compass:

```javascript
// ============================================
// Indexes cho todoLists collection
// ============================================

// Compound index: (appUserId, appId)
db.todoLists.createIndex(
  { appUserId: 1, appId: 1 },
  { 
    name: "idx_appUserId_appId",
    background: true 
  }
);

// Index: appId
db.todoLists.createIndex(
  { appId: 1 },
  { 
    name: "idx_appId",
    background: true 
  }
);

// Index: appUserId (verify existing)
db.todoLists.createIndex(
  { appUserId: 1 },
  { 
    name: "idx_appUserId",
    background: true 
  }
);

// ============================================
// Indexes cho todoItems collection
// ============================================

// Compound index: (appId, todoListId)
db.todoItems.createIndex(
  { appId: 1, todoListId: 1 },
  { 
    name: "idx_appId_todoListId",
    background: true 
  }
);

// Index: todoListId (verify existing)
db.todoItems.createIndex(
  { todoListId: 1 },
  { 
    name: "idx_todoListId",
    background: true 
  }
);

// Index: appId
db.todoItems.createIndex(
  { appId: 1 },
  { 
    name: "idx_appId",
    background: true 
  }
);

// ============================================
// Indexes cho userApps collection (chỉ trong main database)
// ============================================

// Index: appUserId (verify existing)
db.userApps.createIndex(
  { appUserId: 1 },
  { 
    name: "idx_appUserId",
    background: true 
  }
);

// Index: tenantMode
db.userApps.createIndex(
  { tenantMode: 1 },
  { 
    name: "idx_tenantMode",
    background: true 
  }
);

// Index: databaseName
db.userApps.createIndex(
  { databaseName: 1 },
  { 
    name: "idx_databaseName",
    background: true 
  }
);

// Compound index: (appUserId, tenantMode)
db.userApps.createIndex(
  { appUserId: 1, tenantMode: 1 },
  { 
    name: "idx_appUserId_tenantMode",
    background: true 
  }
);
```

### Option 3: Chạy từ Program.cs Startup (Optional)

Uncomment code sau trong `Program.cs` để tự động tạo indexes khi app start:

```csharp
// Auto-create indexes on startup (optional)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var indexService = scope.ServiceProvider.GetRequiredService<IndexCreationService>();
        try
        {
            await indexService.CreateIndexesForMainDatabaseAsync();
            Console.WriteLine("✓ Indexes created successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Error creating indexes: {ex.Message}");
        }
    }
}
```

## Indexes được tạo

### Collection: todoLists
1. **Compound index:** `(appUserId, appId)` - Name: `idx_appUserId_appId`
   - Tối ưu queries filter theo cả user và app
2. **Index:** `appId` - Name: `idx_appId`
   - Tối ưu queries filter theo app
3. **Index:** `appUserId` - Name: `idx_appUserId`
   - Tối ưu queries filter theo user (backward compatible)

### Collection: todoItems
1. **Compound index:** `(appId, todoListId)` - Name: `idx_appId_todoListId`
   - Tối ưu queries filter theo app và list
2. **Index:** `todoListId` - Name: `idx_todoListId`
   - Tối ưu queries filter theo list (backward compatible)
3. **Index:** `appId` - Name: `idx_appId`
   - Tối ưu queries filter theo app

### Collection: userApps (chỉ trong main database)
1. **Index:** `appUserId` - Name: `idx_appUserId`
   - Tối ưu queries filter theo user
2. **Index:** `tenantMode` - Name: `idx_tenantMode`
   - Tối ưu queries filter theo tenant mode
3. **Index:** `databaseName` - Name: `idx_databaseName`
   - Tối ưu queries filter theo database name
4. **Compound index:** `(appUserId, tenantMode)` - Name: `idx_appUserId_tenantMode`
   - Tối ưu queries filter theo user và tenant mode

## Verification

Sau khi chạy script, verify bằng cách:

1. **Check index status qua API:**
   ```bash
   GET /api/migration/index-status
   ```

2. **Verify trong MongoDB:**
   ```javascript
   // Kiểm tra indexes cho todoLists
   db.todoLists.getIndexes();
   
   // Kiểm tra indexes cho todoItems
   db.todoItems.getIndexes();
   
   // Kiểm tra indexes cho userApps
   db.userApps.getIndexes();
   ```

3. **Verify index usage:**
   ```javascript
   // Explain query để xem index có được dùng không
   db.todoLists.find({ appUserId: "userId", appId: "appId" }).explain("executionStats");
   ```

## Idempotent

Script là **idempotent** - có thể chạy nhiều lần an toàn:
- Kiểm tra index đã tồn tại trước khi tạo
- MongoDB sẽ bỏ qua nếu index đã tồn tại
- Không gây lỗi nếu chạy lại

## Performance Notes

- **Background indexing:** Tất cả indexes được tạo với `background: true` để không block operations
- **Query optimization:** Indexes sẽ cải thiện đáng kể performance cho multi-tenant queries
- **Storage:** Indexes chiếm thêm storage space, nhưng cải thiện query speed

## Troubleshooting

### Lỗi: "Index already exists"
- **Giải pháp:** Bỏ qua, index đã tồn tại là OK (idempotent)

### Lỗi: "Collection not found"
- **Giải pháp:** Đảm bảo database đã có collections (tạo ít nhất 1 record trước)

### Index creation chậm
- **Giải pháp:** Bình thường với large datasets, indexes được tạo trong background

### Index không được sử dụng
- **Giải pháp:** 
  - Verify query filter matches index fields
  - Check query execution plan với `.explain()`
  - Đảm bảo filter theo đúng thứ tự index fields
