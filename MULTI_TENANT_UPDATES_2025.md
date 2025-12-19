# 🔄 CẬP NHẬT CẤU TRÚC MULTI-TENANT & LUỒNG HOẠT ĐỘNG (12/2025)

Tài liệu này ghi lại các thay đổi mới nhất trong kiến trúc Multi-tenant của dự án NEXUS-403, tập trung vào việc cô lập dữ liệu cho ứng dụng cài đặt từ Marketplace và cải thiện trải nghiệm Runtime.

## 1. 📦 Luồng Cài Đặt Ứng Dụng Từ Marketplace (Mới)

Trước đây, các ứng dụng cài đặt từ Marketplace có thể chưa được định rõ cơ chế lưu trữ. Hiện tại, hệ thống đã được cập nhật để đảm bảo **mọi ứng dụng cài đặt từ Marketplace đều có Database riêng biệt**.

### Quy trình xử lý (`MarketplaceController.InstallApp`):

1.  **Clone Project**:
    *   Hệ thống sao chép thông tin từ Project gốc (trên Marketplace).
    *   Tạo một `Project` mới cho người dùng hiện tại (`AppUserId` = Current User).
    *   Thiết lập `TenantMode = "separate"` (Chế độ cơ sở dữ liệu riêng).
    *   Lưu `MarketplaceAppId` và `OriginalAuthor` để truy xuất nguồn gốc.

2.  **Khởi tạo Database Riêng**:
    *   Gọi `TenantDatabaseService.GenerateDatabaseName(newProjectId)` để tạo tên DB (ví dụ: `app_6765...`).
    *   Gọi `TenantDatabaseService.CreateSeparateDatabaseAsync(dbName)` để khởi tạo database vật lý trên MongoDB.
    *   Cập nhật trường `DatabaseName` trong document `Project` vừa tạo.

### Kết quả:
*   Mỗi lần user nhấn "Install", một bản sao ứng dụng được tạo ra.
*   Dữ liệu (Tasks, Lists, v.v.) của bản sao này sẽ nằm trong database `app_{NewProjectId}`, hoàn toàn tách biệt với ứng dụng gốc và các ứng dụng khác của user.

---

## 2. 🔄 Luồng Dữ Liệu Runtime (Cập nhật)

Để đảm bảo dữ liệu hiển thị đúng cho từng App (đặc biệt là các App có DB riêng), luồng dữ liệu từ Frontend xuống Database đã được chuẩn hóa.

### Frontend (`AppRuntimePage` & Components):
*   **Context**: `AppRuntimePage` lấy `appId` từ URL.
*   **Data Fetching**: Hook `useTaskData` và `apiService` luôn kèm theo `appId` trong mọi request (GET, POST, PUT, DELETE).
*   **Component Rendering**:
    *   Các component hiển thị (Table, Kanban) nhận dữ liệu từ cha (`RenderComponent`), không tự fetch lại để đảm bảo đồng bộ.
    *   Các component điều khiển (Button, Filter) được render **phía trên** các component dữ liệu (nhờ cập nhật layout Flexbox).

### Backend (`TodoItemsController` & `AppDbContext`):
*   **Routing**: Controller nhận `appId` từ Query String hoặc Body.
*   **Database Resolution** (`AppDbContext.GetAppDatabase`):
    1.  Tìm `Project` hoặc `UserApp` dựa trên `appId`.
    2.  Kiểm tra `TenantMode`.
    3.  Nếu `TenantMode == "separate"`, kết nối tới database `DatabaseName` (ví dụ: `app_xyz`).
    4.  Nếu `TenantMode == "shared"`, kết nối tới database chính (`nexus`).

---

## 3. 🛠️ Các Thay Đổi Quan Trọng Trong Code

### Backend
*   **`TodoApi/Controllers/MarketplaceController.cs`**:
    *   Inject `TenantDatabaseService`.
    *   Cập nhật logic `InstallApp` để tạo DB riêng ngay lập tức.
*   **`TodoApi/Controllers/TodoItemsController.cs`**:
    *   Cập nhật các endpoint `Put`, `Patch`, `Delete` để nhận tham số `appId`, đảm bảo thao tác đúng trên DB của tenant.

### Frontend
*   **`src/pages/AppRuntimePage.jsx`**:
    *   Phân loại component thành `controlComponents` (nút bấm) và `dataComponents` (bảng/biểu đồ).
    *   Render `controlComponents` trước để tránh bị đẩy xuống dưới cùng.
    *   Sử dụng Flexbox để căn giữa giao diện.
*   **`src/components/builder/renders/TaskBoardRender.jsx`**:
    *   Sửa lỗi logic `!isPreview` chặn kéo thả trong chế độ Runtime.
    *   Sửa lỗi cú pháp trong hàm `handleDelete`.

---

## 4. ✅ Checklist Kiểm Tra (Verification)

Khi kiểm thử tính năng này, hãy đảm bảo:

1.  [ ] **Install App**: Vào Marketplace -> Install một app bất kỳ.
2.  [ ] **Check DB**: Kiểm tra MongoDB, phải thấy một database mới tên `app_{NewProjectId}` được tạo.
3.  [ ] **Runtime Data**: Vào App vừa install -> Tạo Task mới.
4.  [ ] **Verify Isolation**:
    *   Task mới phải nằm trong database `app_{NewProjectId}`.
    *   Task mới **không** được xuất hiện trong database chính (`nexus`) hoặc database của app gốc.
