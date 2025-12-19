# 🏢 KIẾN TRÚC MULTI-TENANT - DỰ ÁN NEXUS-403

## 📋 TỔNG QUAN

**Multi-tenant** là kiến trúc cho phép nhiều người dùng (tenants) sử dụng cùng một ứng dụng với dữ liệu được cô lập và bảo mật. Trong dự án NEXUS-403, mỗi **UserApp** (hoặc **Project**) là một tenant độc lập.

Hệ thống hỗ trợ hai chế độ lưu trữ dữ liệu (Tenant Modes):

| Chế độ | Mô tả | Use Case |
|--------|-------|----------|
| **Shared** | Tất cả apps dùng chung database chính (`nexus`), phân biệt bằng `appId` | Phù hợp cho apps nhỏ, ít data, muốn tiết kiệm tài nguyên |
| **Separate** (Isolated) | Mỗi app có database riêng biệt (`app_{id}`) | Phù hợp cho apps lớn, apps cài từ Marketplace, cần bảo mật cao |

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
        │    │  AppDbContext.GetAppDatabase()      │   │
        │    │  - Check UserApp/Project            │   │
        │    │  - Check TenantMode                 │   │
        │    │  - Resolve Database Name            │   │
        │    └─────────────────────────────────────┘   │
        │                                               │
        └───────────┬───────────────────┬───────────────┘
                    │                   │
    ┌───────────────┴─────┐   ┌─────────┴──────────────┐
    │   SHARED MODE       │   │   SEPARATE MODE        │
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

1.  **Extract Info**: Lấy `appId` từ Query String hoặc Route, `userId` từ JWT Token.
2.  **Validate**: Kiểm tra định dạng `appId` (MongoDB ObjectId).
3.  **Verify Ownership**: Gọi `TenantSecurityHelper.VerifyAppOwnershipAsync` để đảm bảo user sở hữu app này.
4.  **Context Injection**: Lưu `AppId` và trạng thái `AppOwned` vào `HttpContext.Items` để các Controller sử dụng.

### 2. **AppDbContext (Trái tim của Multi-tenant)**

Class này chịu trách nhiệm quyết định kết nối tới database nào.

#### Logic `GetAppDatabase(string appId)`:
1.  **Tìm App**: Tìm `UserApp` hoặc `Project` trong database chính (`nexus`) dựa trên `appId`.
2.  **Kiểm tra Mode**:
    *   Nếu `TenantMode == "separate"` VÀ có `DatabaseName`: Kết nối tới database riêng (ví dụ: `app_6765...`).
    *   Nếu `TenantMode == "shared"` hoặc không tìm thấy: Kết nối tới database chính (`nexus`).
3.  **Fallback**: Nếu có lỗi, luôn fallback về database chính để tránh crash.

### 3. **TenantDatabaseService**

Service quản lý vòng đời của database tenant.

*   **GenerateDatabaseName(appId)**: Tạo tên DB chuẩn (`app_{id}`).
*   **CreateSeparateDatabaseAsync(dbName)**: Tạo database vật lý trên MongoDB.
*   **MigrateToSeparateDatabaseAsync**: (Optional) Di chuyển dữ liệu từ Shared sang Separate.

---

## 🔄 CÁC LUỒNG NGHIỆP VỤ (WORKFLOWS)

### A. Tạo App Mới (App Builder)
1.  User tạo Project mới.
2.  Mặc định `TenantMode = "separate"` (để tối ưu hóa ngay từ đầu).
3.  `ProjectsController` gọi `TenantDatabaseService` để tạo database `app_{projectId}`.
4.  Lưu thông tin vào collection `projects` trong DB chính.

### B. Cài Đặt App Từ Marketplace
1.  User chọn "Install" một app.
2.  `MarketplaceController` clone thông tin Project gốc.
3.  Tạo Project mới cho user với `TenantMode = "separate"`.
4.  Tự động tạo database riêng `app_{newProjectId}`.
5.  Kết quả: App cài đặt hoàn toàn cô lập với App gốc.

### C. Runtime Data Access (CRUD)
1.  Frontend gửi request kèm `appId` (ví dụ: `GET /api/todoitems?appId=xyz`).
2.  `TenantValidationMiddleware` xác thực quyền sở hữu.
3.  `TodoItemsController` gọi `_appDbContext.GetAppDatabase(appId)`.
4.  `AppDbContext` trả về kết nối tới DB `app_xyz`.
5.  Query được thực thi trên DB `app_xyz`.

---

## 🛡️ BẢO MẬT VÀ PHÂN QUYỀN

### Security Layers:

1.  **Authentication**: JWT Token xác định danh tính User.
2.  **Middleware Validation**: Chặn ngay các request không hợp lệ hoặc truy cập trái phép vào App của người khác.
3.  **Database Isolation**:
    *   **Separate Mode**: Dữ liệu nằm ở DB vật lý khác, không thể query nhầm.
    *   **Shared Mode**: Luôn filter theo `appId` và `appUserId`.

---

## 📊 DATABASE SCHEMA

### Main Database: `nexus`
Chứa thông tin quản lý hệ thống và các app dùng chung.

```
nexus/
├── users                    # Identity users
├── roles                    # Identity roles
├── userApps                 # Apps configuration (Legacy)
├── projects                 # App Builder projects (Main)
│   ├── _id
│   ├── name
│   ├── appUserId           # Owner
│   ├── tenantMode          # "shared" | "separate"
│   ├── databaseName        # "app_xxx"
│   └── marketplaceAppId    # Link to source app
├── categories               # Marketplace categories
├── todoLists                # SHARED MODE lists
└── todoItems                # SHARED MODE items
```

### Tenant Database: `app_{id}`
Chỉ chứa dữ liệu nghiệp vụ của App đó.

```
app_abc123/
├── todoLists                # Lists của riêng App này
│   ├── _id
│   ├── name
│   └── appId = "abc123"
└── todoItems                # Items của riêng App này
    ├── _id
    ├── title
    ├── status
    └── appId = "abc123"
```

---

## 💡 KHI NÀO DÙNG CHẾ ĐỘ NÀO?

### Shared Mode
*   **Ưu điểm**: Tiết kiệm tài nguyên, dễ quản lý backup chung.
*   **Nhược điểm**: Rủi ro query nhầm data nếu code lỗi, khó scale khi data quá lớn.
*   **Khuyên dùng**: Cho các app demo, app cá nhân nhỏ.

### Separate Mode (Khuyên dùng cho Production)
*   **Ưu điểm**: Bảo mật tuyệt đối (vật lý), performance cao (index riêng, không bị ảnh hưởng bởi app khác), dễ dàng backup/restore từng app.
*   **Nhược điểm**: Tốn tài nguyên hệ thống (nhiều DB con).
*   **Khuyên dùng**: Cho các app cài từ Marketplace, app doanh nghiệp, app có lượng dữ liệu lớn.

---

**Cập nhật lần cuối**: 20/12/2025
**Phiên bản**: 2.0 (Marketplace Integration Update)
