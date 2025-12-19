# 🧪 HƯỚNG DẪN TEST API TRÊN SWAGGER

Tài liệu này cung cấp hướng dẫn chi tiết để test tất cả các API endpoints của dự án NEXUS-403 trên Swagger UI.

## 📋 Mục Lục
1. [Chuẩn Bị](#chuẩn-bị)
2. [Auth APIs](#1-auth-apis)
3. [Projects APIs](#2-projects-apis)
4. [TodoLists APIs](#3-todolists-apis)
5. [TodoItems APIs](#4-todoitems-apis)
6. [Dashboard APIs](#5-dashboard-apis)
7. [Marketplace APIs](#6-marketplace-apis)
8. [UserApps APIs](#7-userapps-apis)
9. [Admin APIs](#8-admin-apis)
10. [Health APIs](#9-health-apis)

---

## Chuẩn Bị

### 1. Khởi động API
```bash
cd TodoApi
dotnet run
```

### 2. Truy cập Swagger UI
Mở trình duyệt và truy cập: `https://localhost:5001/swagger` hoặc `http://localhost:5000/swagger`

### 3. Lưu ý quan trọng
- ✅ Các API có ký hiệu 🔓 không cần authentication
- 🔒 Các API khác cần JWT Token (phải login trước)
- 👑 Các API trong Admin Controller cần role "Admin"
- 📝 Lưu lại `Token` và `UserId` sau khi login thành công

---

## 1. Auth APIs

### 🔓 1.1. POST /api/auth/register - Đăng ký tài khoản mới

**Request Body:**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Test@123"
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "User created successfully!"
}
```

**Lưu ý:**
- Password phải có ít nhất 6 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt
- Email phải unique
- Tự động được gán role "User"

---

### 🔓 1.2. POST /api/auth/login - Đăng nhập

**Request Body:**
```json
{
  "email": "testuser@example.com",
  "password": "Test@123"
}
```

**Response mong đợi (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "testuser@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ QUAN TRỌNG:**
1. **Copy token** từ response
2. Click nút **"Authorize"** 🔐 ở góc trên bên phải Swagger UI
3. Nhập: `Bearer <your-token>` (có dấu cách sau chữ Bearer)
4. Click **"Authorize"**, sau đó **"Close"**
5. Giờ bạn đã có thể test các API cần authentication! 🎉

---

### 🔓 1.3. POST /api/auth/create-admin - Tạo tài khoản Admin

**Request Body:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "Admin account created successfully!"
}
```

**Lưu ý:**
- Tài khoản được tạo sẽ có cả 2 roles: "Admin" và "User"
- Sau khi tạo, login với tài khoản này để test Admin APIs

---

### 🔓 1.4. POST /api/auth/google-login - Đăng nhập Google

**Request Body:**
```json
{
  "idToken": "<Google-ID-Token-from-Google-Sign-In>"
}
```

**Lưu ý:**
- Cần có Google Client ID được cấu hình trong appsettings.json
- Token lấy từ Google Sign-In flow

---

## 2. Projects APIs

### 🔒 2.1. POST /api/projects - Tạo project mới

**Request Body:**
```json
{
  "name": "My First Project",
  "description": "This is my test project",
  "jsonData": "{\"version\":\"1.0\",\"components\":[]}"
}
```

**Response mong đợi (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "My First Project",
  "description": "This is my test project",
  "jsonData": "{\"version\":\"1.0\",\"components\":[]}",
  "isPublished": false,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 2.2. GET /api/projects - Lấy danh sách projects của tôi

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "My First Project",
    "description": "This is my test project",
    "jsonData": "{\"version\":\"1.0\",\"components\":[]}",
    "isPublished": false,
    "createdAt": "2025-12-20T10:00:00Z"
  }
]
```

---

### 🔒 2.3. GET /api/projects/{id} - Lấy chi tiết 1 project

**Parameters:**
- `id`: Project ID (ví dụ: `507f1f77bcf86cd799439011`)

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "My First Project",
  "description": "This is my test project",
  "jsonData": "{\"version\":\"1.0\",\"components\":[]}",
  "isPublished": false,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 2.4. PUT /api/projects/{id} - Cập nhật project

**Parameters:**
- `id`: Project ID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "jsonData": "{\"version\":\"1.1\",\"components\":[{\"type\":\"button\"}]}"
}
```

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Updated Project Name",
  "description": "Updated description",
  "jsonData": "{\"version\":\"1.1\",\"components\":[{\"type\":\"button\"}]}",
  "isPublished": false,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 2.5. DELETE /api/projects/{id} - Xóa project

**Parameters:**
- `id`: Project ID

**Response mong đợi (204 No Content)**

---

### 🔒 2.6. POST /api/projects/{id}/publish - Publish project lên Marketplace

**Parameters:**
- `id`: Project ID

**Request Body:**
```json
{
  "category": "Productivity",
  "price": 0
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "Project published successfully!",
  "projectId": "507f1f77bcf86cd799439011"
}
```

**Lưu ý:**
- Category có thể là: "Productivity", "Education", "Business", "Template", etc.
- Price = 0 nghĩa là miễn phí

---

### 🔒 2.7. POST /api/projects/{id}/unpublish - Gỡ project khỏi Marketplace

**Parameters:**
- `id`: Project ID

**Response mong đợi (200 OK):**
```json
{
  "message": "Project unpublished successfully!"
}
```

---

## 3. TodoLists APIs

### 🔒 3.1. POST /api/todolists - Tạo todo list mới

**Request Body:**
```json
{
  "name": "My Todo List",
  "description": "List of tasks for today",
  "appId": null
}
```

**Response mong đợi (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "My Todo List",
  "description": "List of tasks for today",
  "appUserId": "507f1f77bcf86cd799439011",
  "appId": null,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

**Lưu ý:**
- `appId` có thể null (dữ liệu cá nhân) hoặc ID của một UserApp (multi-tenant)

---

### 🔒 3.2. GET /api/todolists - Lấy danh sách todo lists

**Query Parameters (optional):**
- `appId`: Filter theo app ID

**Ví dụ:**
- `/api/todolists` - Lấy tất cả lists của user
- `/api/todolists?appId=507f1f77bcf86cd799439013` - Lấy lists của một app cụ thể

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "My Todo List",
    "description": "List of tasks for today",
    "appUserId": "507f1f77bcf86cd799439011",
    "appId": null,
    "createdAt": "2025-12-20T10:00:00Z"
  }
]
```

---

### 🔒 3.3. GET /api/todolists/{id} - Lấy chi tiết todo list

**Parameters:**
- `id`: TodoList ID

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "My Todo List",
  "description": "List of tasks for today",
  "appUserId": "507f1f77bcf86cd799439011",
  "appId": null,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 3.4. PUT /api/todolists/{id} - Cập nhật todo list

**Parameters:**
- `id`: TodoList ID

**Request Body:**
```json
{
  "name": "Updated Todo List",
  "description": "Updated description"
}
```

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Updated Todo List",
  "description": "Updated description",
  "appUserId": "507f1f77bcf86cd799439011",
  "appId": null,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 3.5. DELETE /api/todolists/{id} - Xóa todo list

**Parameters:**
- `id`: TodoList ID

**Response mong đợi (204 No Content)**

**Lưu ý:**
- Xóa list sẽ tự động xóa tất cả items trong list đó

---

## 4. TodoItems APIs

### 🔒 4.1. POST /api/todoitems - Tạo todo item mới

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": 0,
  "todoListId": "507f1f77bcf86cd799439012",
  "appId": null,
  "dueDate": "2025-12-25T00:00:00Z",
  "priority": 1
}
```

**Response mong đợi (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": 0,
  "todoListId": "507f1f77bcf86cd799439012",
  "appId": null,
  "dueDate": "2025-12-25T00:00:00Z",
  "priority": 1,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

**Lưu ý:**
- `status`: 0 = Not Started, 1 = In Progress, 2 = Completed
- `priority`: 0 = Low, 1 = Normal, 2 = High
- `dueDate` có thể null

---

### 🔒 4.2. GET /api/todoitems - Lấy danh sách todo items

**Query Parameters (optional):**
- `appId`: Filter theo app ID
- `todoListId`: Filter theo list ID

**Ví dụ:**
- `/api/todoitems` - Lấy tất cả items
- `/api/todoitems?todoListId=507f1f77bcf86cd799439012` - Items của một list
- `/api/todoitems?appId=507f1f77bcf86cd799439013&todoListId=507f1f77bcf86cd799439012` - Items của một list trong một app

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": 0,
    "todoListId": "507f1f77bcf86cd799439012",
    "appId": null,
    "dueDate": "2025-12-25T00:00:00Z",
    "priority": 1,
    "createdAt": "2025-12-20T10:00:00Z"
  }
]
```

---

### 🔒 4.3. GET /api/todoitems/{id} - Lấy chi tiết todo item

**Parameters:**
- `id`: TodoItem ID

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": 0,
  "todoListId": "507f1f77bcf86cd799439012",
  "appId": null,
  "dueDate": "2025-12-25T00:00:00Z",
  "priority": 1,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 4.4. PUT /api/todoitems/{id} - Cập nhật todo item

**Parameters:**
- `id`: TodoItem ID

**Request Body:**
```json
{
  "title": "Buy groceries (Updated)",
  "description": "Milk, eggs, bread, butter",
  "status": 1,
  "dueDate": "2025-12-26T00:00:00Z",
  "priority": 2
}
```

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "title": "Buy groceries (Updated)",
  "description": "Milk, eggs, bread, butter",
  "status": 1,
  "todoListId": "507f1f77bcf86cd799439012",
  "appId": null,
  "dueDate": "2025-12-26T00:00:00Z",
  "priority": 2,
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 4.5. PATCH /api/todoitems/{id}/status - Cập nhật trạng thái item

**Parameters:**
- `id`: TodoItem ID

**Request Body:**
```json
{
  "status": 2
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "Item status updated successfully"
}
```

---

### 🔒 4.6. DELETE /api/todoitems/{id} - Xóa todo item

**Parameters:**
- `id`: TodoItem ID

**Response mong đợi (204 No Content)**

---

## 5. Dashboard APIs

### 🔒 5.1. GET /api/dashboard/stats - Lấy thống kê dashboard

**Response mong đợi (200 OK):**
```json
{
  "totalLists": 5,
  "totalTasks": 23,
  "completedTasks": 12
}
```

**Lưu ý:**
- Chỉ đếm lists và tasks của user hiện tại
- `completedTasks`: Số task có status = 2 (Completed)

---

## 6. Marketplace APIs

### 🔒 6.1. GET /api/marketplace/apps - Lấy danh sách apps trên Marketplace

**Query Parameters (optional):**
- `category`: Filter theo category (ví dụ: "Productivity", "Education", "All")

**Ví dụ:**
- `/api/marketplace/apps` - Tất cả apps
- `/api/marketplace/apps?category=Productivity` - Apps trong category Productivity
- `/api/marketplace/apps?category=All` - Tất cả apps

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Task Manager Pro",
    "description": "Professional task management app",
    "category": "Productivity",
    "author": "john_doe",
    "tags": ["Community", "Productivity"],
    "downloads": "15",
    "rating": 0,
    "color": "sage",
    "isInstalled": false,
    "price": 0
  }
]
```

---

### 🔒 6.2. GET /api/marketplace/apps/{id} - Xem chi tiết app

**Parameters:**
- `id`: App ID (Project ID)

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Task Manager Pro",
  "description": "Professional task management app",
  "category": "Productivity",
  "author": "john_doe",
  "tags": ["Community", "Productivity"],
  "downloads": "15",
  "rating": 0,
  "color": "sage",
  "isInstalled": false,
  "price": 0
}
```

---

### 🔒 6.3. POST /api/marketplace/install/{id} - Cài đặt app từ Marketplace

**Parameters:**
- `id`: App ID (Project ID)

**Request Body:**
```json
{
  "tenantMode": "shared"
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "App installed successfully",
  "projectId": "507f1f77bcf86cd799439015",
  "userAppId": "507f1f77bcf86cd799439016"
}
```

**Lưu ý:**
- `tenantMode`: "shared" (dùng chung database) hoặc "isolated" (database riêng)
- API sẽ tạo một bản copy của Project và một UserApp mới

---

### 🔒 6.4. GET /api/marketplace/categories - Lấy danh sách categories

**Response mong đợi (200 OK):**
```json
[
  {
    "name": "All",
    "count": 10
  },
  {
    "name": "Productivity",
    "count": 5
  },
  {
    "name": "Education",
    "count": 3
  },
  {
    "name": "Business",
    "count": 2
  }
]
```

---

## 7. UserApps APIs

### 🔒 7.1. GET /api/userapps - Lấy danh sách apps của user

**Query Parameters (optional):**
- `filter`: "all" (default), "created", hoặc "downloaded"

**Ví dụ:**
- `/api/userapps` - Tất cả apps
- `/api/userapps?filter=created` - Chỉ apps tự tạo
- `/api/userapps?filter=downloaded` - Chỉ apps đã cài từ Marketplace

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439016",
    "name": "Task Manager Pro",
    "icon": "📋",
    "description": "Professional task management app",
    "config": {},
    "source": "downloaded",
    "marketplaceAppId": "507f1f77bcf86cd799439011",
    "originalAuthor": "john_doe",
    "tenantMode": "shared",
    "databaseName": null,
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  }
]
```

---

### 🔒 7.2. GET /api/userapps/{id} - Lấy chi tiết một app

**Parameters:**
- `id`: UserApp ID

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439016",
  "name": "Task Manager Pro",
  "icon": "📋",
  "description": "Professional task management app",
  "config": {},
  "source": "downloaded",
  "marketplaceAppId": "507f1f77bcf86cd799439011",
  "originalAuthor": "john_doe",
  "tenantMode": "shared",
  "databaseName": null,
  "createdAt": "2025-12-20T10:00:00Z",
  "updatedAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 7.3. POST /api/userapps - Tạo app mới (thủ công)

**Request Body:**
```json
{
  "name": "My Custom App",
  "icon": "🚀",
  "description": "My custom application",
  "config": {},
  "tenantMode": "shared"
}
```

**Response mong đợi (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439017",
  "name": "My Custom App",
  "icon": "🚀",
  "description": "My custom application",
  "config": {},
  "source": "created",
  "marketplaceAppId": null,
  "originalAuthor": null,
  "tenantMode": "shared",
  "databaseName": null,
  "createdAt": "2025-12-20T10:00:00Z",
  "updatedAt": "2025-12-20T10:00:00Z"
}
```

---

### 🔒 7.4. PUT /api/userapps/{id} - Cập nhật app

**Parameters:**
- `id`: UserApp ID

**Request Body:**
```json
{
  "name": "My Custom App (Updated)",
  "icon": "⭐",
  "description": "Updated description",
  "config": {"theme": "dark"}
}
```

**Response mong đợi (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439017",
  "name": "My Custom App (Updated)",
  "icon": "⭐",
  "description": "Updated description",
  "config": {"theme": "dark"},
  "source": "created",
  "marketplaceAppId": null,
  "originalAuthor": null,
  "tenantMode": "shared",
  "databaseName": null,
  "createdAt": "2025-12-20T10:00:00Z",
  "updatedAt": "2025-12-20T10:30:00Z"
}
```

---

### 🔒 7.5. DELETE /api/userapps/{id} - Xóa app

**Parameters:**
- `id`: UserApp ID

**Response mong đợi (204 No Content)**

**Lưu ý:**
- Nếu app có `tenantMode = "isolated"`, database riêng cũng sẽ bị xóa
- Tất cả dữ liệu liên quan (TodoLists, TodoItems) sẽ bị xóa

---

### 🔒 7.6. POST /api/userapps/{id}/switch-tenant-mode - Chuyển đổi tenant mode

**Parameters:**
- `id`: UserApp ID

**Request Body:**
```json
{
  "newTenantMode": "isolated"
}
```

**Response mong đợi (200 OK):**
```json
{
  "message": "Tenant mode switched successfully",
  "userApp": {
    "id": "507f1f77bcf86cd799439017",
    "tenantMode": "isolated",
    "databaseName": "app_507f1f77bcf86cd799439017"
  }
}
```

**Lưu ý:**
- `newTenantMode`: "shared" hoặc "isolated"
- Dữ liệu sẽ được migrate tự động giữa các database

---

## 8. Admin APIs

**⚠️ Cần login với tài khoản Admin để test các APIs này!**

### 👑 8.1. GET /api/admin/users - Lấy danh sách tất cả users

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userName": "testuser",
    "email": "testuser@example.com",
    "isLocked": false,
    "lockoutEnd": null,
    "lockoutEnabled": true,
    "roles": ["User"]
  },
  {
    "id": "507f1f77bcf86cd799439018",
    "userName": "admin",
    "email": "admin@example.com",
    "isLocked": false,
    "lockoutEnd": null,
    "lockoutEnabled": true,
    "roles": ["Admin", "User"]
  }
]
```

---

### 👑 8.2. POST /api/admin/users/{userId}/lock - Khóa tài khoản user

**Parameters:**
- `userId`: User ID cần khóa

**Response mong đợi (200 OK):**
```json
{
  "message": "User locked successfully"
}
```

**Lưu ý:**
- User bị khóa sẽ không thể login cho đến khi được unlock

---

### 👑 8.3. POST /api/admin/users/{userId}/unlock - Mở khóa tài khoản user

**Parameters:**
- `userId`: User ID cần mở khóa

**Response mong đợi (200 OK):**
```json
{
  "message": "User unlocked successfully"
}
```

---

### 👑 8.4. GET /api/admin/marketplace-apps - Xem tất cả apps trên Marketplace (Admin view)

**Response mong đợi (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Task Manager Pro",
    "description": "Professional task management app",
    "createdAt": "2025-12-20T10:00:00Z",
    "authorId": "507f1f77bcf86cd799439019",
    "authorName": "john_doe",
    "authorEmail": "john@example.com"
  }
]
```

---

### 👑 8.5. DELETE /api/admin/marketplace-apps/{id} - Xóa app khỏi Marketplace

**Parameters:**
- `id`: Project ID (App ID)

**Response mong đợi (200 OK):**
```json
{
  "message": "App removed from marketplace successfully"
}
```

**Lưu ý:**
- Chỉ unpublish app, không xóa project gốc của author

---

## 9. Health APIs

### 🔓 9.1. GET /api/health - Kiểm tra health của API

**Response mong đợi (200 OK):**
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "database": "NEXUS-403",
  "collections": [
    "projects",
    "todoLists",
    "todoItems",
    "userApps",
    "users",
    "roles"
  ],
  "counts": {
    "projects": 10,
    "todoLists": 25,
    "todoItems": 78,
    "userApps": 15
  },
  "timestamp": "2025-12-20T10:00:00Z"
}
```

**Lưu ý:**
- API này không cần authentication
- Dùng để kiểm tra API và MongoDB có hoạt động tốt không

---

## 🎯 Workflow Test Đầy Đủ

### Scenario 1: User thông thường
1. ✅ Register tài khoản mới
2. ✅ Login và lấy token
3. ✅ Authorize trong Swagger
4. ✅ Tạo một số Projects
5. ✅ Publish 1 project lên Marketplace
6. ✅ Tạo TodoLists và TodoItems
7. ✅ Xem Dashboard stats
8. ✅ Browse Marketplace và install một app
9. ✅ Xem UserApps của mình
10. ✅ Test switch tenant mode

### Scenario 2: Admin
1. ✅ Create admin account
2. ✅ Login với admin
3. ✅ Xem danh sách users
4. ✅ Lock/Unlock một user
5. ✅ Xem và quản lý Marketplace apps
6. ✅ Xóa app khỏi Marketplace

---

## 📝 Tips & Troubleshooting

### Lỗi thường gặp:

**1. 401 Unauthorized**
- Kiểm tra đã Authorize chưa
- Kiểm tra token có đúng format: `Bearer <token>`
- Token có thể đã hết hạn, login lại

**2. 403 Forbidden**
- API cần role Admin nhưng user hiện tại không có role này
- Hoặc đang cố truy cập resource của user khác

**3. 404 Not Found**
- ID không tồn tại trong database
- Check lại ID có đúng format MongoDB ObjectId không

**4. 400 Bad Request**
- Request body sai format
- Thiếu required fields
- Validate dữ liệu không pass

**5. 500 Internal Server Error**
- Lỗi server
- Check logs trong console để xem chi tiết
- Có thể là MongoDB connection issue

### Best Practices:
- ✅ Luôn test Health API trước để đảm bảo API đang chạy
- ✅ Login và Authorize trước khi test các API cần authentication
- ✅ Lưu lại các IDs quan trọng (userId, projectId, listId, etc.)
- ✅ Test theo thứ tự: Auth → Create → Read → Update → Delete
- ✅ Test cả success cases và error cases
- ✅ Kiểm tra response status code và message

---

## 🔗 Tài Liệu Liên Quan

- [PROJECT_FEATURES_DOCUMENTATION.md](PROJECT_FEATURES_DOCUMENTATION.md)
- [MULTI_TENANT_ARCHITECTURE.md](MULTI_TENANT_ARCHITECTURE.md)
- [CTDA.md](CTDA.md)

---

**Chúc bạn test thành công! 🚀**
