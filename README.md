# 🚀 NEXUS-403

**NEXUS-403** là một hệ thống quản lý công việc (Todo Management) nâng cao được tích hợp tính năng **App Builder**, cho phép người dùng tự tạo, thiết kế và chia sẻ các ứng dụng tùy chỉnh. Dự án được xây dựng dựa trên kiến trúc **Multi-tenant** tiên tiến, hỗ trợ quản lý vòng đời và dữ liệu của nhiều ứng dụng linh hoạt, độc lập.

---

## 🌟 Các tính năng nổi bật

- **Quản lý công việc cốt lõi (Todo Management):** Tạo, phân loại, đánh giá mức độ ưu tiên và theo dõi trạng thái công việc nhanh chóng.
- **Trình kiến tạo ứng dụng (App Builder):** Cung cấp giao diện thiết kế kéo-thả (Canvas) để cấu hình linh hoạt các component tuỳ chỉnh, dễ dàng tạo ra các phiên bản ứng dụng Todo mang dấu ấn cá nhân.
- **Kho ứng dụng (Marketplace):** Cho phép người dùng "publish" các ứng dụng vừa thiết kế lên kho chung, hoặc "install" (cài đặt) hàng loạt template có sẵn từ cộng đồng.
- **Hỗ trợ Multi-Tenant:** Tùy chọn chạy ứng dụng trên Database chia sẻ (Shared) hoặc độc lập (Isolated) để tối ưu hoá hiệu suất, quản lý tài nguyên và bảo mật.
- **Dashboard và Thống kê:** Hiển thị và trực quan hóa các dữ liệu, tiến độ công việc một cách thông minh.
- **Bảo mật và Phân quyền:** Đảm bảo an toàn thông qua JWT Token-based (ASP.NET Identity), hỗ trợ tính năng đăng nhập Google OAuth. Có hệ thống phân quyển Admin quản lý hệ thống.

## 🛠 Công nghệ sử dụng (Tech Stack)

### **Backend:**
- ASP.NET Core Web API (C#)
- ASP.NET Core Identity
- JWT Authentication

### **Frontend:**
- ReactJS
- Vite
- TailwindCSS

### **Cơ sở dữ liệu:**
- MongoDB (NoSQL) phân mảnh theo mô hình Multi-Tenancy.

## 📂 Tổ chức mã nguồn

Hệ thống được chia thành hai module chính:
- 📁 **`TodoApi/`**: Thư mục chứa mã nguồn Backend (ASP.NET Core). Bao gồm API controllers, services, repositories và các thiết lập bảo mật.
- 📁 **`todo-frontend/`**: Thư mục chứa mã nguồn giao diện Frontend (React). Hoạt động độc lập và giao tiếp với Backend thông qua RESTful APIs.
- 📄 **Tài liệu tham khảo chuyên sâu**: Nằm rải rác ở thư mục gốc và các thư mục `docs/`.

## 🚀 Hướng dẫn cài đặt và khởi chạy

### Yêu cầu về môi trường:
- .NET 8.0 SDK (đối với Backend)
- Node.js (>= 18.x) và npm (đối với Frontend)
- MongoDB Server đang hoạt động (Local hoặc Mongo Atlas)

### Bước 1: Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd TodoApi
   ```
2. Hãy đảm bảo bạn đã cấu hình chuỗi kết nối MongoDB trong `appsettings.Development.json` (hoặc `appsettings.json`).
3. Khôi phục packages và chạy project:
   ```bash
   dotnet restore
   dotnet run
   ```
   *Note: Backend mặc định sẽ khởi chạy và cung cấp Swagger UI tại `https://localhost:7045/swagger/` (có thể thay đổi tùy cấu hình môi trường).*

### Bước 2: Khởi chạy Frontend
1. Mở một terminal/command prompt khác, di chuyển vào thư mục frontend:
   ```bash
   cd todo-frontend
   ```
2. Cài đặt các gói phụ thuộc (Dependencies) và chạy Vite server dev:
   ```bash
   npm install
   npm run dev
   ```
   *Note: Frontend mặc định sẽ chạy tại địa chỉ `http://localhost:5173/`.*

## 📚 Tài liệu đính kèm kèm theo

Dự án này đi kèm nội bộ với rất nhiều các tài liệu chi tiết hướng dẫn từ thiết lập đến tích hợp các design pattern. Vui lòng tham khảo (trong thư mục gốc):

- 📜 [**Tổng quan tính năng dự án (PROJECT_FEATURES_DOCUMENTATION.md)**](./PROJECT_FEATURES_DOCUMENTATION.md): Nơi định nghĩa chi tiết mọi collection CSDL, các endpoint, và luồng dữ liệu logic.
- 📜 [**Cây thư mục (CTDA.md)**](./CTDA.md): Tham khảo cấu trúc chi tiết của toàn bộ dự án gốc.
- 📜 [**Kiến trúc Multi-tenant (MULTI_TENANT_ARCHITECTURE.md)**](./MULTI_TENANT_ARCHITECTURE.md): Phân tích sâu hơn về chiến lược phân tách dữ liệu cho người dùng.
- 📜 [**Hướng dẫn Swagger API (SWAGGER_API_TESTING_GUIDE.md)**](./SWAGGER_API_TESTING_GUIDE.md): Chỉ dẫn việc test các HTTP endpoint nhanh nhất qua giao diện Swagger.

---

> 🎉 Cảm ơn bạn đã tham gia nghiên cứu và phát triển mã nguồn của **NEXUS-403**. Nếu bạn có bất kỳ câu hỏi nào trong quá trình cài đặt, vui lòng tham khảo các hướng dẫn troubleshooting trong thư mục `docs/`.
