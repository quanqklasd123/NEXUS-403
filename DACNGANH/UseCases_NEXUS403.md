# Use Case & Chức năng — NEXUS-403

Tài liệu này liệt kê các chức năng chính của hệ thống NEXUS-403 và cung cấp sơ đồ use case (Mermaid) cho từng chức năng, kèm một sơ đồ tổng hợp.

---

## 1. Tổng quan chức năng chính

1. Authentication & Authorization (Đăng nhập, đăng ký, quản lý token, role)
2. App Builder (tạo, chỉnh sửa project/ứng dụng)
3. Runtime / Preview (xem app ở chế độ chạy/preview)
4. Publish to Marketplace (xuất bản project lên Marketplace)
5. Marketplace (duyệt, xem preview, cài đặt ứng dụng)
6. My Apps / UserApps (quản lý ứng dụng đã cài / của người dùng)
7. Categories & Marketplace Management (tạo/danh mục/lọc)
8. Components Library (thư viện component, cài đặt component từ Marketplace)
9. Install / Import from Marketplace (cài app vào tài khoản người dùng)
10. Admin Panel (quản trị người dùng, quản trị marketplace)
11. Undo/Redo & History (lưu snapshot, undo/redo trong App Builder)
12. Publish/Download/Export (xuất bản, tải về, clone)
13. APIs REST (các endpoint để frontend tương tác)
14. Monitoring & Health (health endpoint, logs)

---

## 2. Actors (Tác nhân)

- End User (Người dùng bình thường)
- Authenticated User (Người dùng đã đăng nhập)
- Admin (Quản trị hệ thống)
- Marketplace (hệ thống/ứng dụng như nguồn)
- App Builder (module nội bộ — xem như hệ thống con)

---

## 3. Use case cho từng chức năng

### 3.1 Authentication & Authorization

```mermaid
usecaseDiagram
actor User as U
actor Admin as A
U --> (Register)
U --> (Login)
U --> (Logout)
A --> (Manage Users)
(Manage Users) ..> (Login) : relies on
```

- Mô tả ngắn:
  - Register: người dùng tạo tài khoản.
  - Login: nhận JWT, lưu `authToken`.
  - Manage Users (Admin): khóa/mở, xoá người dùng.

**Luồng chính (Login)**
- Người dùng nhập email/password → Hệ thống xác thực → Trả về JWT → Lưu token → Trả UI thành công.

---

### 3.2 App Builder (Tạo, sửa project)

```mermaid
usecaseDiagram
actor User as U
U --> (Create Project)
U --> (Edit Project)
U --> (Save Project)
U --> (Undo/Redo)
U --> (Preview in Runtime)
U --> (Publish Project)
```

- Mô tả:
  - Create/Edit: kéo-thả component, cấu hình props.
  - Save: gọi `POST/PUT /projects`.
  - Undo/Redo: lưu snapshot history.
  - Preview: mở `AppRuntimePage`.
  - Publish: gọi `/projects/{id}/publish` để đưa lên Marketplace.

**Luồng chính (Publish)**
- User chọn Publish → điền metadata (name, description, category, price) → Gọi API `publishProject` → Nếu thành công app xuất hiện tại Marketplace.

---

### 3.3 Runtime / Preview

```mermaid
usecaseDiagram
actor User as U
U --> (Open Runtime)
(Open Runtime) --> (Render Components)
(Open Runtime) --> (Handle Events)
```

- Mô tả: Render `jsonData` thành UI, xử lý events (click, input), hỗ trợ `context` (ví dụ `now`).

---

### 3.4 Marketplace (Duyệt, xem preview, cài đặt)

```mermaid
usecaseDiagram
actor User as U
actor Admin as A
U --> (Browse Marketplace)
U --> (View App Detail)
U --> (Preview App)
U --> (Install App)
A --> (Create Category)
A --> (Manage Marketplace Apps)
```

- Luồng Install: User chọn Install → Gọi API `/marketplace/install/{id}` → Tạo `UserApp` cho user → Thông báo thành công.

---

### 3.5 My Apps / UserApps

```mermaid
usecaseDiagram
actor User as U
U --> (List My Apps)
U --> (Open My App)
U --> (Edit My App)
U --> (Delete My App)
```

- Mô tả: Danh sách các app user đã cài hoặc tạo; cung cấp chức năng edit, delete, export.

---

### 3.6 Categories & Marketplace Management

```mermaid
usecaseDiagram
actor Admin as A
A --> (Create Category)
A --> (Edit Category)
A --> (Delete Category)
U --> (Filter by Category)
```

---

### 3.7 Components Library & Install Components

```mermaid
usecaseDiagram
actor User as U
U --> (Browse Components)
U --> (Install Component)
U --> (Use Component in Builder)
```

- Mô tả: Components có thể là module nhỏ (date picker, chart) — cài vào builder để reuse.

---

### 3.8 Admin Panel

```mermaid
usecaseDiagram
actor Admin as A
A --> (View Users)
A --> (Lock/Unlock User)
A --> (Manage Marketplace Apps)
A --> (View System Health)
```

---

### 3.9 Undo/Redo & History

```mermaid
usecaseDiagram
actor User as U
U --> (Make Change)
U --> (Undo)
U --> (Redo)
U --> (View History)
```

- Mô tả: App Builder lưu snapshots; người dùng có thể undo/redo.

---

### 3.10 API Endpoints (tương tác)

```mermaid
usecaseDiagram
actor System as S
actor User as U
U --> (Call REST APIs)
S --> (Authenticate)
S --> (Get Projects)
S --> (Get Marketplace Apps)
S --> (Install App)
```

---

## 4. Use case tổng hợp (Overall)

```mermaid
usecaseDiagram
actor User as U
actor Admin as A
U --> (Login)
U --> (Browse Marketplace)
U --> (Install App)
U --> (Open in App Builder / My Apps)
U --> (Edit Project)
U --> (Publish to Marketplace)
A --> (Manage Users)
A --> (Manage Marketplace)
```

- Mô tả chuỗi chính (User journey):
  1. Đăng nhập
  2. Duyệt Marketplace → Xem preview
  3. Cài app vào My Apps
  4. Mở app trong App Builder → chỉnh sửa
  5. Lưu → Publish lên Marketplace (nếu muốn)

---

## 5. Ghi chú & hướng tiếp theo

- Sơ đồ Mermaid ở trên có thể được render bởi các trình đọc Markdown hỗ trợ Mermaid.
- Nếu bạn muốn mình xuất bản các sơ đồ ra image SVG/PNG hoặc chỉnh chi tiết từng bước cho một use case cụ thể (flowchart chi tiết), mình có thể tạo thêm.
- Nếu cần, mình sẽ thêm mô tả chi tiết (precondition, postcondition, alternate flows) cho từng use case cụ thể.

---

File được tạo tự động bởi công cụ hỗ trợ phát triển. Nếu muốn mình chỉnh lại tên actor, thêm use case chi tiết, hay tạo sơ đồ PNG, nói mình biết nhé.
