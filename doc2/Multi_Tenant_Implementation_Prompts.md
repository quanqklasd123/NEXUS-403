# Multi-Tenant Implementation Prompts

File này chứa các prompts sẵn sàng để copy-paste vào AI Assistant (như Cursor, ChatGPT, Claude) để implement multi-tenant database architecture.

---

## 🎯 Prompt 1: Setup Foundation - Thêm AppId vào Models

```
Tôi đang implement multi-tenant database architecture cho project NEXUS-403. 
Hãy thực hiện các bước sau:

1. **Update TodoList Model** (TodoApi/Models/TodoList.cs):
   - Thêm field `AppId` (nullable string) với BsonElement("appId")
   - Giữ nguyên các fields hiện có

2. **Update TodoItem Model** (TodoApi/Models/TodoItem.cs):
   - Thêm field `AppId` (nullable string) với BsonElement("appId")
   - Giữ nguyên các fields hiện có

3. **Update UserApp Model** (TodoApi/Models/UserApp.cs):
   - Thêm field `DatabaseName` (nullable string) với BsonElement("databaseName")
   - Thêm field `TenantMode` (string, default = "shared") với BsonElement("tenantMode")

4. **Update DTOs**:
   - CreateTodoListDTO: Thêm `AppId` (nullable string)
   - CreateTodoItemDTO: Thêm `AppId` (nullable string)
   - UpdateTodoListDTO: Thêm `AppId` (nullable string)
   - UpdateTodoItemDTO: Thêm `AppId` (nullable string)

5. **Backward Compatibility**:
   - Tất cả AppId fields phải nullable để existing data vẫn hoạt động
   - Không thay đổi logic hiện có, chỉ thêm fields mới

Hãy đọc các file models và DTOs hiện tại trước khi update để đảm bảo không break existing code.
```

---

## 🎯 Prompt 2: Tạo AppDbContext Helper Class

```
Tạo class AppDbContext trong TodoApi/Data/AppDbContext.cs với các chức năng sau:

**Yêu cầu:**
1. Class này là helper để quản lý database context cho từng app (tenant)

2. **Constructor:**
   - Nhận IMongoClient và MongoDbContext (main context)
   - Lưu vào private fields

3. **Method: GetAppDatabase(string? appId)**
   - Nếu appId null hoặc empty → trả về main database (_mainContext.Database)
   - Nếu appId có giá trị:
     a. Query UserApp từ main database để lấy TenantMode và DatabaseName
     b. Nếu TenantMode = "separate" và DatabaseName không null → trả về database riêng (_mongoClient.GetDatabase(databaseName))
     c. Nếu TenantMode = "shared" hoặc DatabaseName null → trả về main database
   - Nếu UserApp không tồn tại → fallback về main database

4. **Method: GetAppCollection<T>(string? appId, string collectionName)**
   - Gọi GetAppDatabase(appId) để lấy database
   - Trả về collection từ database đó: database.GetCollection<T>(collectionName)

5. **Register trong DI** (Program.cs):
   - AddScoped<AppDbContext> với dependency injection cho IMongoClient và MongoDbContext

**Lưu ý:**
- Xử lý null/empty appId gracefully
- Log warnings nếu UserApp không tìm thấy
- Đảm bảo thread-safe
```

---

## 🎯 Prompt 3: Update TodoListsController với AppId Support

```
Update TodoListsController để hỗ trợ multi-tenant với AppId:

**Yêu cầu:**

1. **Inject AppDbContext:**
   - Thêm AppDbContext vào constructor
   - Giữ nguyên MongoDbContext (dùng cho UserApp queries)

2. **GET /api/todolists:**
   - Thêm query parameter `appId` (optional)
   - Filter theo AppUserId (từ JWT token) - BẮT BUỘC
   - Nếu appId có giá trị → filter thêm theo AppId
   - Nếu appId null → chỉ filter theo AppUserId (backward compatible)
   - Sử dụng AppDbContext.GetAppCollection() để lấy collection từ đúng database
   - Return TodoListDTO list

3. **GET /api/todolists/{id}:**
   - Filter theo Id, AppUserId, và AppId (nếu có)
   - Verify ownership (AppUserId match)
   - Sử dụng AppDbContext để lấy từ đúng database

4. **POST /api/todolists:**
   - Lấy AppId từ CreateTodoListDTO
   - Set AppId vào TodoList model khi tạo
   - Set AppUserId từ JWT token
   - Sử dụng AppDbContext để insert vào đúng database
   - Return created TodoListDTO

5. **PUT /api/todolists/{id}:**
   - Verify ownership (AppUserId match)
   - Update AppId nếu có trong DTO
   - Sử dụng AppDbContext để update trong đúng database

6. **DELETE /api/todolists/{id}:**
   - Verify ownership
   - Delete từ đúng database
   - Xóa tất cả TodoItems liên quan (cascade delete)

**Security:**
- Luôn verify AppUserId từ JWT token
- Không cho phép user access data của user khác
- Validate AppId ownership (nếu có)

**Backward Compatibility:**
- Nếu AppId null trong existing data → vẫn hoạt động bình thường
- Không break existing API calls
```

---

## 🎯 Prompt 4: Update TodoItemsController với AppId Support

```
Update TodoItemsController tương tự TodoListsController:

**Yêu cầu:**

1. **Inject AppDbContext vào constructor**

2. **GET /api/todoitems:**
   - Query parameter: `appId` (optional), `todoListId` (optional)
   - Filter theo AppUserId (bắt buộc)
   - Filter theo AppId nếu có
   - Filter theo TodoListId nếu có
   - Sử dụng AppDbContext để lấy từ đúng database

3. **GET /api/todoitems/{id}:**
   - Filter theo Id, AppUserId, AppId
   - Verify ownership

4. **POST /api/todoitems:**
   - Lấy AppId từ CreateTodoItemDTO
   - Set AppId và AppUserId vào TodoItem
   - Verify TodoListId thuộc về cùng AppId (nếu có)
   - Insert vào đúng database

5. **PUT /api/todoitems/{id}:**
   - Verify ownership
   - Update AppId nếu có trong DTO
   - Verify TodoListId match nếu update

6. **DELETE /api/todoitems/{id}:**
   - Verify ownership
   - Delete từ đúng database

**Lưu ý:**
- Khi tạo TodoItem, phải verify TodoListId thuộc về cùng AppId
- Cascade delete: Khi xóa TodoList, xóa tất cả TodoItems liên quan
```

---

## 🎯 Prompt 5: Tạo Migration Script

```
Tạo migration script để update existing data với multi-tenant support:

**File: TodoApi/Scripts/MigrateToMultiTenant.cs hoặc .md với MongoDB script**

**Yêu cầu:**

1. **Update existing TodoLists:**
   - Set AppId = null cho tất cả existing records (backward compatible)
   - Giữ nguyên AppUserId

2. **Update existing TodoItems:**
   - Set AppId = null cho tất cả existing records
   - Giữ nguyên AppUserId và TodoListId

3. **Update existing UserApps:**
   - Set TenantMode = "shared" cho tất cả existing records
   - Set DatabaseName = null

4. **Create Indexes:**
   - todoLists: compound index on (appUserId, appId)
   - todoLists: index on (appId)
   - todoItems: compound index on (appId, todoListId)
   - todoItems: index on (todoListId)
   - userApps: index on (appUserId)
   - userApps: index on (tenantMode)

5. **Script phải:**
   - Idempotent (có thể chạy nhiều lần an toàn)
   - Log progress
   - Handle errors gracefully
   - Có thể chạy từ command line hoặc API endpoint

**Format:**
- C# script với MongoDB.Driver
- Hoặc MongoDB shell script (.js)
- Hoặc markdown với instructions để chạy manual
```

---

## 🎯 Prompt 6: Implement Separate Database Mode

```
Implement separate database mode cho UserApp:

**Yêu cầu:**

1. **Update UserAppsController - POST /api/userapps:**
   - Thêm parameter `tenantMode` trong CreateUserAppDTO (optional, default = "shared")
   - Nếu tenantMode = "separate":
     a. Generate database name: `app_{appId}` hoặc `app_{hash(appId)}`
     b. Tạo database mới trong MongoDB (nếu chưa tồn tại)
     c. Tạo collections cơ bản: todoLists, todoItems
     d. Set DatabaseName trong UserApp model
   - Nếu tenantMode = "shared": DatabaseName = null

2. **Update AppDbContext.GetAppDatabase():**
   - Nếu TenantMode = "separate" và DatabaseName không null:
     a. Get database: _mongoClient.GetDatabase(databaseName)
     b. Tự động tạo database nếu chưa tồn tại (MongoDB tự tạo khi first write)
     c. Return database đó
   - Nếu TenantMode = "shared": return main database

3. **Add API Endpoint - POST /api/userapps/{id}/switch-tenant-mode:**
   - Body: { "tenantMode": "shared" | "separate" }
   - Verify ownership (AppUserId match)
   - Nếu switch từ "shared" → "separate":
     a. Tạo database mới
     b. Migrate data từ main database sang database riêng
     c. Update UserApp.DatabaseName và TenantMode
   - Nếu switch từ "separate" → "shared":
     a. Migrate data từ database riêng về main database
     b. Set DatabaseName = null
     c. Update TenantMode
     d. (Optional) Xóa database riêng sau khi migrate

4. **Data Migration Helper:**
   - Method để copy data từ main DB → separate DB
   - Method để copy data từ separate DB → main DB
   - Verify data integrity sau khi migrate

**Lưu ý:**
- Database name phải unique và valid (MongoDB naming rules)
- Migration phải atomic nếu có thể
- Backup data trước khi migrate
- Log tất cả operations
```

---

## 🎯 Prompt 7: Add Security & Validation

```
Thêm security và validation cho multi-tenant:

**Yêu cầu:**

1. **Create Helper Method - VerifyAppOwnership:**
   - File: TodoApi/Helpers/TenantSecurityHelper.cs (hoặc trong Controller base class)
   - Method: `Task<bool> VerifyAppOwnership(string appId, string userId)`
   - Query UserApp từ main database
   - Verify AppUserId match với userId từ JWT
   - Return true nếu owned, false nếu not found hoặc not owned

2. **Create Middleware (Optional):**
   - File: TodoApi/Middleware/TenantValidationMiddleware.cs
   - Validate AppId trong route/query params
   - Verify ownership trước khi cho phép access
   - Set HttpContext.Items["AppId"] và ["AppOwned"] để controllers dùng

3. **Update Controllers:**
   - Tất cả methods có AppId phải verify ownership
   - Return 403 Forbidden nếu không owned
   - Return 404 Not Found nếu app không tồn tại (không leak info)

4. **Validation Rules:**
   - AppId phải là valid ObjectId format
   - AppId không thể set thành app của user khác
   - Khi tạo TodoList/TodoItem, verify AppId thuộc về user hiện tại

5. **Add Unit Tests:**
   - Test VerifyAppOwnership với valid/invalid cases
   - Test controller với unauthorized AppId
   - Test cross-tenant access prevention

**Security Best Practices:**
- Never expose internal errors (database names, etc.)
- Log security violations
- Rate limiting cho tenant operations
```

---

## 🎯 Prompt 8: Create Indexes Script

```
Tạo script để tạo indexes cho multi-tenant collections:

**File: TodoApi/Scripts/CreateMultiTenantIndexes.cs hoặc MongoDB script**

**Indexes cần tạo:**

1. **Collection: todoLists**
   - Compound index: { appUserId: 1, appId: 1 }
   - Index: { appId: 1 }
   - Index: { appUserId: 1 } (existing, verify)

2. **Collection: todoItems**
   - Compound index: { appId: 1, todoListId: 1 }
   - Index: { todoListId: 1 } (existing, verify)
   - Index: { appId: 1 }

3. **Collection: userApps**
   - Index: { appUserId: 1 } (existing, verify)
   - Index: { tenantMode: 1 }
   - Index: { databaseName: 1 }
   - Compound index: { appUserId: 1, tenantMode: 1 }

**Script requirements:**
- Idempotent (check if index exists before create)
- Log created indexes
- Handle errors
- Có thể chạy từ Program.cs startup hoặc separate command
- Support cả main database và separate databases

**Format:**
- C# với MongoDB.Driver
- Hoặc MongoDB shell script
```

---

## 🎯 Prompt 9: Testing Multi-Tenant

```
Tạo test cases cho multi-tenant functionality:

**Test Files:**
- TodoApi.Tests/Controllers/TodoListsControllerTests.cs
- TodoApi.Tests/Controllers/TodoItemsControllerTests.cs
- TodoApi.Tests/Data/AppDbContextTests.cs
- TodoApi.Tests/Helpers/TenantSecurityHelperTests.cs

**Test Cases:**

1. **Shared Mode Tests:**
   - Tạo TodoList với AppId → verify lưu trong main database
   - Query TodoList với AppId → verify chỉ trả về list của app đó
   - User A không thể access TodoList của User B
   - App A không thể access TodoList của App B

2. **Separate Database Mode Tests:**
   - Tạo UserApp với TenantMode = "separate" → verify database được tạo
   - Tạo TodoList trong separate database → verify lưu đúng chỗ
   - Query từ separate database → verify data isolation
   - Switch tenant mode → verify data migration

3. **Backward Compatibility Tests:**
   - Existing data (AppId = null) vẫn query được
   - Old API calls (không có AppId) vẫn hoạt động
   - Migration script không break existing data

4. **Security Tests:**
   - Unauthorized access → 403 Forbidden
   - Invalid AppId → 404 Not Found
   - Cross-tenant access attempt → blocked

5. **Performance Tests:**
   - Query performance với indexes
   - Database switching overhead
   - Large dataset handling

**Test Setup:**
- Use in-memory MongoDB hoặc test database
- Mock JWT tokens với different user IDs
- Cleanup sau mỗi test
```

---

## 🎯 Prompt 10: Documentation & API Examples

```
Tạo documentation và API examples cho multi-tenant:

**File: docs/Multi_Tenant_API_Documentation.md**

**Nội dung:**

1. **Overview:**
   - Giải thích multi-tenant architecture
   - Shared vs Separate database modes
   - AppId concept

2. **API Endpoints:**
   - GET /api/todolists?appId={appId}
   - POST /api/todolists (với AppId trong body)
   - GET /api/todoitems?appId={appId}&todoListId={listId}
   - POST /api/todoitems (với AppId trong body)
   - POST /api/userapps/{id}/switch-tenant-mode

3. **Request/Response Examples:**
   - JSON examples cho mỗi endpoint
   - Error responses
   - Success responses

4. **Authentication:**
   - JWT token requirements
   - AppId ownership verification

5. **Migration Guide:**
   - Cách migrate existing data
   - Cách switch tenant mode
   - Best practices

6. **Troubleshooting:**
   - Common issues
   - How to verify AppId
   - How to check database isolation

**Format:**
- Markdown với code blocks
- Swagger/OpenAPI examples
- Postman collection (optional)
```

---

## 📝 Cách sử dụng

1. **Copy prompt** phù hợp với task bạn muốn implement
2. **Paste vào AI Assistant** (Cursor, ChatGPT, Claude, etc.)
3. **Review code** được generate
4. **Test thoroughly** trước khi commit
5. **Update documentation** nếu cần

## 🔄 Thứ tự thực hiện

1. **Prompt 1**: Setup Foundation (Models & DTOs)
2. **Prompt 2**: AppDbContext Helper
3. **Prompt 8**: Create Indexes
4. **Prompt 3 & 4**: Update Controllers
5. **Prompt 5**: Migration Script
6. **Prompt 7**: Security & Validation
7. **Prompt 6**: Separate Database (Optional)
8. **Prompt 9**: Testing
9. **Prompt 10**: Documentation

---

**Lưu ý:** Mỗi prompt có thể được sử dụng độc lập, nhưng nên follow thứ tự để đảm bảo dependencies được resolve đúng.
