# 📋 TÀI LIỆU CHỨC NĂNG DỰ ÁN NEXUS-403

## 📌 TỔNG QUAN DỰ ÁN

**NEXUS-403** là một ứng dụng Todo Management với khả năng tạo và chia sẻ ứng dụng tùy chỉnh thông qua App Builder. Dự án sử dụng kiến trúc **Multi-tenant** hỗ trợ người dùng tạo và quản lý nhiều ứng dụng độc lập.

### Stack công nghệ:
- **Backend**: ASP.NET Core Web API + MongoDB + ASP.NET Identity
- **Frontend**: React + Vite + TailwindCSS
- **Database**: MongoDB (NoSQL)
- **Authentication**: JWT Token-based

---

## 🗄️ CẤU TRÚC CƠ SỞ DỮ LIỆU

### 1. **Collection: Users** (AspNetCore Identity)
Quản lý thông tin người dùng và xác thực.

```javascript
{
  _id: ObjectId,
  UserName: String,
  Email: String,
  PasswordHash: String,    // Mã hóa bởi Identity
  SecurityStamp: String,
  Roles: ["User", "Admin"] // Phân quyền
}
```

### 2. **Collection: Projects**
Lưu trữ các dự án/template được tạo từ App Builder.

```javascript
{
  _id: ObjectId,
  name: String,              // Tên project
  description: String,       // Mô tả
  jsonData: String,          // JSON chứa cấu hình Canvas (các components, nodes)
  isPublished: Boolean,      // Đã publish lên Marketplace chưa
  appUserId: String,         // ID của user sở hữu
  category: String,          // Danh mục (Template, Productivity, etc.)
  price: String,             // Giá (null = Free)
  marketplaceAppId: String,  // ID gốc nếu install từ Marketplace
  originalAuthor: String,    // Author gốc (nếu install)
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Quan hệ**: 
- `appUserId` → `Users._id`
- `marketplaceAppId` → `Projects._id` (self-reference)

### 3. **Collection: UserApps**
Lưu các ứng dụng runtime của user (created/downloaded).

```javascript
{
  _id: ObjectId,
  name: String,             // Tên app
  icon: String,             // Emoji icon
  description: String,
  config: String,           // JSON config của components
  source: String,           // "created" | "downloaded"
  marketplaceAppId: String, // ID app gốc từ Marketplace
  originalAuthor: String,   // Tác giả gốc
  appUserId: String,        // User sở hữu
  tenantMode: String,       // "shared" | "isolated"
  databaseName: String,     // Tên DB riêng (nếu isolated mode)
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Quan hệ**:
- `appUserId` → `Users._id`
- `marketplaceAppId` → `Projects._id`

### 4. **Collection: TodoLists**
Danh sách các Todo List.

```javascript
{
  _id: ObjectId,
  name: String,         // Tên list (vd: "Work Tasks")
  itemIds: [String],    // Mảng các ObjectId của TodoItems
  appUserId: String,    // User sở hữu
  appId: String         // UserApp ID (multi-tenant)
}
```

**Quan hệ**:
- `appUserId` → `Users._id`
- `appId` → `UserApps._id`
- `itemIds[]` → `TodoItems._id`

### 5. **Collection: TodoItems**
Các task/item trong Todo List.

```javascript
{
  _id: ObjectId,
  title: String,        // Tiêu đề task
  status: Int,          // 0: To Do, 1: In Progress, 2: Completed
  priority: Int,        // 1: Low, 2: Medium, 3: High
  dueDate: DateTime,    // Ngày hết hạn
  todoListId: String,   // List chứa item này
  appId: String         // UserApp ID (multi-tenant)
}
```

**Quan hệ**:
- `todoListId` → `TodoLists._id`
- `appId` → `UserApps._id`

### 6. **Collection: Categories**
Danh mục cho Marketplace.

```javascript
{
  _id: ObjectId,
  name: String,         // Tên category
  description: String,
  color: String,        // "sage", "peach", "butter", "neutral"
  createdAt: DateTime,
  createdBy: String     // User ID tạo category
}
```

**Quan hệ**:
- `createdBy` → `Users._id`

---

## 🎯 CÁC CHỨC NĂNG CHÍNH VÀ LUỒNG HOẠT ĐỘNG

### 1. 🔐 **AUTHENTICATION (Xác thực)**

#### Endpoints:
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/create-admin` - Tạo tài khoản Admin
- `POST /api/auth/google-login` - Đăng nhập Google

#### Luồng hoạt động:

**A. Đăng ký (Register)**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/auth/register                          |
   |  {email, username, password}                        |
   |------------------------->|                            |
   |                          | 2. Check email exists     |
   |                          |--------------------------->|
   |                          | 3. Email available         |
   |                          |<---------------------------|
   |                          | 4. Hash password           |
   |                          | 5. Create AppUser          |
   |                          |--------------------------->|
   |                          | 6. Assign "User" role      |
   |                          |--------------------------->|
   | 7. Success response      |                            |
   |<-------------------------|                            |
```

**B. Đăng nhập (Login)**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/auth/login  |                            |
   |  {email, password}       |                            |
   |------------------------->|                            |
   |                          | 2. Find user by email      |
   |                          |--------------------------->|
   |                          | 3. User data               |
   |                          |<---------------------------|
   |                          | 4. Verify password hash    |
   |                          | 5. Generate JWT token      |
   |                          |    - Include userId        |
   |                          |    - Include roles         |
   | 6. Return token          |                            |
   |<-------------------------|                            |
   | 7. Store token in        |                            |
   |    localStorage          |                            |
```

**C. Các request tiếp theo**
```
Frontend                    Backend                     
   |                          |                            
   | 1. API request           |                            
   |  Header: Authorization:  |                            
   |  Bearer {JWT_TOKEN}      |                            
   |------------------------->|                            
   |                          | 2. Validate JWT token      
   |                          | 3. Extract userId & roles  
   |                          | 4. Process request         
   | 5. Response              |                            
   |<-------------------------|                            
```

---

### 2. 🏗️ **APP BUILDER (Tạo ứng dụng tùy chỉnh)**

#### Endpoints:
- `GET /api/projects` - Lấy danh sách projects
- `GET /api/projects/{id}` - Lấy chi tiết project
- `POST /api/projects` - Tạo project mới
- `PUT /api/projects/{id}` - Cập nhật project
- `DELETE /api/projects/{id}` - Xóa project
- `POST /api/projects/{id}/publish` - Publish lên Marketplace

#### Luồng hoạt động:

**A. Tạo Project mới**
```
Frontend (AppBuilderPage)   Backend                     Database
   |                          |                            |
   | 1. User designs app      |                            |
   |    on Canvas             |                            |
   |    - Drag & drop components                          |
   |    - Configure properties                            |
   |                          |                            |
   | 2. POST /api/projects    |                            |
   |  {name, description,     |                            |
   |   jsonData: {...}}       |                            |
   |------------------------->|                            |
   |                          | 3. Extract userId from JWT |
   |                          | 4. Create Project object   |
   |                          |    - appUserId = userId    |
   |                          |    - isPublished = false   |
   |                          |--------------------------->|
   |                          | 5. Project saved           |
   |                          |<---------------------------|
   | 6. Return project ID     |                            |
   |<-------------------------|                            |
   | 7. Navigate to project   |                            |
   |    detail page           |                            |
```

**B. Chỉnh sửa Project**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. GET /api/projects/{id}|                            |
   |------------------------->|                            |
   |                          | 2. Check ownership         |
   |                          |    appUserId == userId?    |
   |                          | 3. Find project            |
   |                          |--------------------------->|
   |                          | 4. Project data            |
   |                          |<---------------------------|
   | 5. Render Canvas with    |                            |
   |    jsonData              |                            |
   |<-------------------------|                            |
   |                          |                            |
   | 6. User modifies design  |                            |
   |                          |                            |
   | 7. PUT /api/projects/{id}|                            |
   |  {jsonData: {...}}       |                            |
   |------------------------->|                            |
   |                          | 8. Verify ownership        |
   |                          | 9. Update project          |
   |                          |--------------------------->|
   | 10. Success              |                            |
   |<-------------------------|                            |
```

**C. Publish lên Marketplace**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/projects/{id}/publish                   |
   |  {category, price}       |                            |
   |------------------------->|                            |
   |                          | 2. Verify ownership        |
   |                          | 3. Validate project data   |
   |                          | 4. Update project:         |
   |                          |    - isPublished = true    |
   |                          |    - category = value      |
   |                          |    - price = value         |
   |                          |--------------------------->|
   | 5. Success               |                            |
   |<-------------------------|                            |
   | 6. Show in Marketplace   |                            |
```

---

### 3. 🛒 **MARKETPLACE (Kho ứng dụng)**

#### Endpoints:
- `GET /api/marketplace/apps` - Lấy danh sách apps (filter by category)
- `GET /api/marketplace/apps/{id}` - Xem chi tiết app
- `POST /api/marketplace/apps/{id}/install` - Cài đặt app
- `GET /api/marketplace/categories` - Lấy danh sách categories

#### Luồng hoạt động:

**A. Duyệt Marketplace**
```
Frontend (MarketplacePage)  Backend                     Database
   |                          |                            |
   | 1. GET /api/marketplace/apps                         |
   |    ?category=Template    |                            |
   |------------------------->|                            |
   |                          | 2. Find Projects:          |
   |                          |    isPublished = true      |
   |                          |    category = "Template"   |
   |                          |--------------------------->|
   |                          | 3. Published projects      |
   |                          |<---------------------------|
   |                          | 4. Check installed apps:   |
   |                          |    Find Projects where:    |
   |                          |    appUserId = currentUser |
   |                          |    marketplaceAppId != null|
   |                          |--------------------------->|
   |                          | 5. Installed app IDs       |
   |                          |<---------------------------|
   |                          | 6. Count installs for each:|
   |                          |    Count Projects where    |
   |                          |    marketplaceAppId = appId|
   |                          |--------------------------->|
   |                          | 7. Get author info         |
   |                          |--------------------------->|
   |                          | 8. Build MarketplaceAppDTO |
   |                          |    - downloads count       |
   |                          |    - isInstalled flag      |
   |                          |    - author name           |
   | 9. Array of marketplace  |                            |
   |    apps                  |                            |
   |<-------------------------|                            |
   | 10. Display app cards    |                            |
```

**B. Cài đặt App từ Marketplace**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/marketplace/apps/{id}/install           |
   |------------------------->|                            |
   |                          | 2. Find original project   |
   |                          |--------------------------->|
   |                          | 3. Original project data   |
   |                          |<---------------------------|
   |                          | 4. Check if already installed:
   |                          |    Find Project where:     |
   |                          |    appUserId = currentUser |
   |                          |    marketplaceAppId = {id} |
   |                          |--------------------------->|
   |                          | 5. Not installed yet       |
   |                          |<---------------------------|
   |                          | 6. Clone project:          |
   |                          |    - Copy jsonData         |
   |                          |    - appUserId = currentUser
   |                          |    - marketplaceAppId = {id}
   |                          |    - originalAuthor = original
   |                          |    - isPublished = false   |
   |                          |--------------------------->|
   |                          | 7. New project created     |
   |                          |<---------------------------|
   | 8. Return new project ID |                            |
   |<-------------------------|                            |
   | 9. Navigate to My Apps   |                            |
```

---

### 4. 📱 **USER APPS (Ứng dụng của người dùng)**

#### Endpoints:
- `GET /api/userapps` - Lấy danh sách apps (filter: all/created/downloaded)
- `GET /api/userapps/{id}` - Lấy chi tiết app
- `POST /api/userapps` - Tạo app mới
- `PUT /api/userapps/{id}` - Cập nhật app
- `DELETE /api/userapps/{id}` - Xóa app
- `POST /api/userapps/{id}/switch-tenant` - Chuyển chế độ tenant

#### Luồng hoạt động:

**A. Lấy danh sách Apps**
```
Frontend (MyAppPage)        Backend                     Database
   |                          |                            |
   | 1. GET /api/userapps     |                            |
   |    ?filter=all           |                            |
   |------------------------->|                            |
   |                          | 2. Find UserApps:          |
   |                          |    appUserId = currentUser |
   |                          |--------------------------->|
   |                          | 3. UserApps data           |
   |                          |<---------------------------|
   |                          | 4. Sort by updatedAt desc  |
   | 5. Array of UserAppDTO   |                            |
   |<-------------------------|                            |
   | 6. Display app cards:    |                            |
   |    - Created apps        |                            |
   |    - Downloaded apps     |                            |
```

**B. Chạy Runtime App**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. Click on app card     |                            |
   |    Navigate to:          |                            |
   |    /app/{appId}          |                            |
   |                          |                            |
   | 2. GET /api/userapps/{id}|                            |
   |------------------------->|                            |
   |                          | 3. Find UserApp            |
   |                          | 4. Check ownership         |
   |                          |--------------------------->|
   |                          | 5. App config data         |
   |                          |<---------------------------|
   | 6. Parse config JSON     |                            |
   |<-------------------------|                            |
   | 7. Render components:    |                            |
   |    - TodoList component  |                            |
   |    - Stats component     |                            |
   |    - Custom components   |                            |
   |                          |                            |
   | 8. Component calls API:  |                            |
   |    GET /api/todolists    |                            |
   |    ?appId={appId}        |                            |
   |------------------------->|                            |
   |                          | 9. Verify app ownership    |
   |                          | 10. Find TodoLists where   |
   |                          |     appId = {appId}        |
   |                          |--------------------------->|
   |                          | 11. TodoLists data         |
   |                          |<---------------------------|
   | 12. Display todo lists   |                            |
   |<-------------------------|                            |
```

**C. Multi-tenant Support**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/userapps/{id}/switch-tenant             |
   |  {mode: "isolated"}      |                            |
   |------------------------->|                            |
   |                          | 2. Verify ownership        |
   |                          | 3. Create isolated DB:     |
   |                          |    dbName = "nexus_{appId}"|
   |                          | 4. Copy data to new DB     |
   |                          | 5. Update UserApp:         |
   |                          |    tenantMode = "isolated" |
   |                          |    databaseName = dbName   |
   |                          |--------------------------->|
   | 6. Success               |                            |
   |<-------------------------|                            |
   | 7. Subsequent requests   |                            |
   |    use isolated DB       |                            |
```

---

### 5. ✅ **TODO MANAGEMENT (Quản lý Task)**

#### Endpoints:
- `GET /api/todolists` - Lấy danh sách todo lists (filter by appId)
- `GET /api/todolists/{id}` - Lấy chi tiết list
- `POST /api/todolists` - Tạo list mới
- `PUT /api/todolists/{id}` - Cập nhật list
- `DELETE /api/todolists/{id}` - Xóa list
- `GET /api/todoitems` - Lấy items (filter by appId/listId)
- `POST /api/todoitems` - Tạo item mới
- `PUT /api/todoitems/{id}` - Cập nhật item
- `PATCH /api/todoitems/{id}/status` - Cập nhật status
- `DELETE /api/todoitems/{id}` - Xóa item

#### Luồng hoạt động:

**A. Tạo Todo List**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/todolists   |                            |
   |  {name: "Work Tasks",    |                            |
   |   appId: "xxx"}          |                            |
   |------------------------->|                            |
   |                          | 2. Verify app ownership    |
   |                          |    via TenantSecurityHelper|
   |                          |--------------------------->|
   |                          | 3. App owned by user       |
   |                          |<---------------------------|
   |                          | 4. Create TodoList:        |
   |                          |    - appUserId = userId    |
   |                          |    - appId = xxx           |
   |                          |--------------------------->|
   |                          | 5. List created            |
   |                          |<---------------------------|
   | 6. Return list DTO       |                            |
   |<-------------------------|                            |
   | 7. Update UI with new list                           |
```

**B. Thêm Todo Item**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. POST /api/todoitems   |                            |
   |  {title: "Fix bug",      |                            |
   |   todoListId: "yyy",     |                            |
   |   appId: "xxx",          |                            |
   |   priority: 2,           |                            |
   |   dueDate: "2025-12-20"} |                            |
   |------------------------->|                            |
   |                          | 2. Validate appId format   |
   |                          | 3. Verify app ownership    |
   |                          |--------------------------->|
   |                          | 4. Verify list ownership   |
   |                          |--------------------------->|
   |                          | 5. Create TodoItem:        |
   |                          |    - todoListId = yyy      |
   |                          |    - appId = xxx           |
   |                          |    - status = 0 (To Do)    |
   |                          |--------------------------->|
   |                          | 6. Update TodoList:        |
   |                          |    itemIds.push(newItemId) |
   |                          |--------------------------->|
   |                          | 7. Item created            |
   |                          |<---------------------------|
   | 8. Return item DTO       |                            |
   |<-------------------------|                            |
   | 9. Add item to UI        |                            |
```

**C. Cập nhật Status**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. User drags item to    |                            |
   |    "In Progress" column  |                            |
   |                          |                            |
   | 2. PATCH /api/todoitems/{id}/status                  |
   |  {status: 1}             |                            |
   |------------------------->|                            |
   |                          | 3. Find TodoItem           |
   |                          |--------------------------->|
   |                          | 4. Verify ownership via:   |
   |                          |    item.appId -> UserApp   |
   |                          |--------------------------->|
   |                          | 5. Update item.status = 1  |
   |                          |--------------------------->|
   | 6. Success               |                            |
   |<-------------------------|                            |
   | 7. Update UI position    |                            |
```

**D. Lấy Items theo Filter**
```
Frontend                    Backend                     Database
   |                          |                            |
   | 1. GET /api/todoitems    |                            |
   |    ?appId=xxx&todoListId=yyy                         |
   |------------------------->|                            |
   |                          | 2. Validate & verify       |
   |                          |    appId ownership         |
   |                          | 3. Build filter:           |
   |                          |    appId = xxx AND         |
   |                          |    todoListId = yyy        |
   |                          | 4. Find TodoItems          |
   |                          |--------------------------->|
   |                          | 5. Items data              |
   |                          |<---------------------------|
   |                          | 6. Sort by priority desc   |
   | 7. Array of TodoItemDTO  |                            |
   |<-------------------------|                            |
   | 8. Display items in list |                            |
```

---

### 6. 📊 **DASHBOARD (Thống kê)**

#### Endpoints:
- `GET /api/dashboard/stats` - Lấy thống kê tổng quan

#### Luồng hoạt động:

```
Frontend (DashboardPage)    Backend                     Database
   |                          |                            |
   | 1. GET /api/dashboard/stats                          |
   |------------------------->|                            |
   |                          | 2. Extract userId from JWT |
   |                          |                            |
   |                          | 3. Count TodoLists:        |
   |                          |    appUserId = userId      |
   |                          |--------------------------->|
   |                          | 4. totalLists = X          |
   |                          |<---------------------------|
   |                          |                            |
   |                          | 5. Get all list IDs        |
   |                          |--------------------------->|
   |                          | 6. listIds = [...]         |
   |                          |<---------------------------|
   |                          |                            |
   |                          | 7. Count TodoItems:        |
   |                          |    todoListId IN listIds   |
   |                          |--------------------------->|
   |                          | 8. totalTasks = Y          |
   |                          |<---------------------------|
   |                          |                            |
   |                          | 9. Count completed items:  |
   |                          |    todoListId IN listIds   |
   |                          |    AND status = 2          |
   |                          |--------------------------->|
   |                          | 10. completedTasks = Z     |
   |                          |<---------------------------|
   |                          |                            |
   |                          | 11. Build DashboardStatsDTO|
   | 12. {totalLists,         |                            |
   |      totalTasks,         |                            |
   |      completedTasks}     |                            |
   |<-------------------------|                            |
   | 13. Display stats:       |                            |
   |     - Total Lists: X     |                            |
   |     - Total Tasks: Y     |                            |
   |     - Completed: Z       |                            |
   |     - Progress: Z/Y %    |                            |
```

---

### 7. 👨‍💼 **ADMIN (Quản trị)**

#### Endpoints:
- `GET /api/admin/categories` - Lấy danh sách categories
- `POST /api/admin/categories` - Tạo category mới
- `PUT /api/admin/categories/{id}` - Cập nhật category
- `DELETE /api/admin/categories/{id}` - Xóa category

#### Luồng hoạt động:

```
Frontend (AdminPage)        Backend                     Database
   |                          |                            |
   | 1. GET /api/admin/categories                         |
   |    Authorization: Bearer {token}                     |
   |------------------------->|                            |
   |                          | 2. [Authorize(Roles="Admin")]
   |                          | 3. Verify user has Admin role
   |                          | 4. Find all Categories     |
   |                          |--------------------------->|
   |                          | 5. Categories data         |
   |                          |<---------------------------|
   | 6. Display in table      |                            |
   |<-------------------------|                            |
   |                          |                            |
   | 7. POST /api/admin/categories                        |
   |  {name: "New Category",  |                            |
   |   color: "sage"}         |                            |
   |------------------------->|                            |
   |                          | 8. Create Category:        |
   |                          |    createdBy = adminUserId |
   |                          |--------------------------->|
   | 9. Success               |                            |
   |<-------------------------|                            |
   | 10. Refresh list         |                            |
```

---

## 🔒 SECURITY & MIDDLEWARE

### 1. **TenantValidationMiddleware**
Middleware xác thực quyền truy cập multi-tenant.

```
Request Flow:
   |
   | 1. Request có appId param/query?
   |    ├─ Yes: Extract appId
   |    └─ No: Continue
   |
   | 2. Find UserApp by appId
   |    └─ Check appUserId == currentUserId?
   |        ├─ Yes: Continue
   |        └─ No: Return 403 Forbidden
   |
   | 3. App có tenantMode = "isolated"?
   |    ├─ Yes: Switch to isolated DB
   |    |        (context.Items["TenantDatabase"] = dbName)
   |    └─ No: Use shared DB
   |
   | 4. Continue to Controller
```

### 2. **TenantSecurityHelper**
Helper class để verify ownership và validate IDs.

```csharp
Methods:
- VerifyAppOwnershipAsync(appId, userId) 
  → Check UserApp.appUserId == userId
  
- VerifyListOwnershipAsync(listId, userId)
  → Check TodoList.appUserId == userId
  
- VerifyItemOwnershipAsync(itemId, userId)
  → Check TodoItem through TodoList ownership
  
- IsValidObjectId(id)
  → Validate MongoDB ObjectId format
```

---

## 🔄 ĐỒNG BỘ DỮ LIỆU

### Project ↔ UserApp
Khi user install app từ Marketplace:

```
1. Project (Marketplace) → Clone → Project (User's copy)
   - Copy: name, description, jsonData
   - Set: marketplaceAppId = originalId
   - Set: appUserId = currentUser
   - Set: isPublished = false
```

### UserApp ↔ TodoLists/TodoItems
Multi-tenant isolation:

```
Shared Mode:
- Tất cả UserApps dùng chung DB "nexus"
- TodoLists/Items có field "appId" để phân biệt

Isolated Mode:
- Mỗi UserApp có DB riêng "nexus_{appId}"
- TodoLists/Items vẫn có field "appId" nhưng nằm ở DB riêng
- Tăng bảo mật và performance khi data lớn
```

---

## 📈 KẾT LUẬN

Dự án NEXUS-403 sử dụng kiến trúc **Multi-tenant** linh hoạt kết hợp với **App Builder** cho phép:

1. **Tính năng cốt lõi**: Quản lý Todo Lists/Items
2. **Tính mở rộng**: Tạo ứng dụng custom với App Builder
3. **Tính cộng đồng**: Marketplace để chia sẻ và cài đặt apps
4. **Tính bảo mật**: Multi-tenant với isolated database option
5. **Tính linh hoạt**: JWT authentication + Role-based authorization

### Điểm mạnh:
- ✅ NoSQL (MongoDB) phù hợp với schema linh hoạt
- ✅ Multi-tenant support tốt
- ✅ Phân tách rõ ràng BE/FE
- ✅ ASP.NET Identity xử lý authentication mạnh mẽ

### Cải thiện có thể:
- 🔄 Implement WebSocket cho real-time updates
- 🔄 Add caching layer (Redis)
- 🔄 Implement rate limiting
- 🔄 Add comprehensive logging & monitoring
- 🔄 Implement unit & integration tests

---

**Ngày tạo**: 18/12/2025  
**Phiên bản**: 1.0
