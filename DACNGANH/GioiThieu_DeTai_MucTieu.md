# BÁO CÁO ĐỒ ÁN NGÀNH

## CHƯƠNG 1: GIỚI THIỆU ĐỀ TÀI VÀ MỤC TIÊU ĐỒ ÁN

## 1.1. Giới thiệu đề tài

### 1.1.1. Tên đề tài

"NEXUS-403: Hệ thống xây dựng và quản lý ứng dụng cá nhân với App Builder và Marketplace"

### 1.1.2. Lý do chọn đề tài

Trong thời đại số hóa hiện nay, nhu cầu sử dụng các ứng dụng quản lý công việc cá nhân ngày càng tăng cao. Tuy nhiên, các ứng dụng hiện có trên thị trường thường có những hạn chế sau:

Thứ nhất, thiếu tính linh hoạt. Người dùng phải sử dụng giao diện và tính năng cố định, không thể tùy chỉnh theo nhu cầu riêng.

Thứ hai, không có nền tảng chia sẻ. Người dùng không thể chia sẻ các mẫu ứng dụng họ đã tạo cho cộng đồng.

Thứ ba, yêu cầu kiến thức lập trình. Để tạo ứng dụng riêng, người dùng cần có kiến thức về lập trình, điều này gây khó khăn cho người dùng phổ thông.

Xuất phát từ những thực trạng trên, đồ án NEXUS-403 được thực hiện nhằm xây dựng một hệ thống cho phép người dùng tự tạo ứng dụng theo ý muốn mà không cần biết lập trình, chia sẻ và tải về các ứng dụng từ cộng đồng thông qua Marketplace, quản lý và sử dụng các ứng dụng đã tạo hoặc tải về một cách tiện lợi.

### 1.1.3. Tổng quan về hệ thống

NEXUS-403 là một nền tảng web application bao gồm các thành phần chính:

- App Builder: Công cụ kéo-thả (drag and drop) cho phép người dùng thiết kế ứng dụng trực quan.
- My App: Không gian quản lý các ứng dụng cá nhân của người dùng.
- Marketplace: Chợ ứng dụng nơi người dùng có thể chia sẻ và tải về các ứng dụng.
- App Runtime: Môi trường chạy ứng dụng đã được tạo hoặc tải về.

Luồng hoạt động của hệ thống như sau: Người dùng có thể tự tạo ứng dụng từ App Builder và lưu vào My App, hoặc tải ứng dụng từ Marketplace về My App. Sau đó, người dùng có thể mở, chỉnh sửa hoặc xóa ứng dụng trong My App. Khi muốn sử dụng, ứng dụng sẽ được chạy trong App Runtime.

## 1.2. Mục tiêu đồ án

### 1.2.1. Mục tiêu tổng quát

Xây dựng một hệ thống web application hoàn chỉnh cho phép người dùng tạo ứng dụng cá nhân thông qua giao diện kéo-thả trực quan, quản lý và sử dụng các ứng dụng đã tạo, chia sẻ ứng dụng lên Marketplace và tải về ứng dụng từ cộng đồng.

### 1.2.2. Mục tiêu cụ thể

#### Về mặt chức năng

a) Hệ thống xác thực người dùng (Authentication)

Hệ thống cung cấp chức năng đăng ký và đăng nhập tài khoản thông thường. Ngoài ra, hệ thống còn hỗ trợ đăng nhập bằng Google OAuth 2.0 để tăng tính tiện lợi cho người dùng. Hệ thống cũng có phân quyền người dùng với hai vai trò chính là User và Admin.

b) App Builder - Công cụ xây dựng ứng dụng

App Builder cung cấp giao diện kéo-thả (drag and drop) trực quan để người dùng thiết kế ứng dụng. Hệ thống hỗ trợ các loại component như Heading, Input, Button, Checkbox, Container, Table và nhiều thành phần khác. Người dùng có thể tùy chỉnh thuộc tính của từng component theo ý muốn. Chế độ Preview cho phép xem trước ứng dụng trước khi lưu. Người dùng có thể lưu ứng dụng và xuất bản lên Marketplace.

c) My App - Quản lý ứng dụng cá nhân

Trang My App hiển thị danh sách tất cả ứng dụng đã tạo hoặc tải về của người dùng. Người dùng có thể mở, chỉnh sửa hoặc xóa ứng dụng. Hệ thống phân loại ứng dụng theo nguồn gốc gồm Created (tự tạo) và Downloaded (tải về).

d) Marketplace - Chợ ứng dụng

Marketplace hiển thị các ứng dụng được chia sẻ từ cộng đồng. Người dùng có thể tìm kiếm và lọc ứng dụng theo danh mục. Chức năng Install cho phép tải ứng dụng về My App. Hệ thống hiển thị thông tin chi tiết của từng ứng dụng.

e) App Runtime - Chạy ứng dụng

App Runtime có chức năng render và chạy các ứng dụng đã tạo. Hệ thống hỗ trợ tương tác với các component và lưu trữ dữ liệu người dùng nhập vào.

#### Về mặt kỹ thuật

a) Frontend

Hệ thống xây dựng Single Page Application (SPA) với React.js phiên bản 18.x. Vite được sử dụng làm build tool để tối ưu hiệu năng phát triển. Giao diện được thiết kế responsive với TailwindCSS phiên bản 3.x. State management sử dụng Context API của React. React Router phiên bản 6.x được sử dụng cho client-side routing. Axios được sử dụng làm HTTP client cho các API calls.

b) Backend

Backend được xây dựng với ASP.NET Core phiên bản 9.0 theo kiến trúc RESTful API. Hệ thống áp dụng kiến trúc MVC (Model-View-Controller). Xác thực sử dụng JWT Token kết hợp với Google OAuth 2.0. Entity Framework Core được sử dụng làm ORM cho SQL Server. MongoDB.Driver được sử dụng để kết nối với MongoDB. AutoMapper được sử dụng cho object-object mapping giữa các DTOs và Models.

c) Database

Hệ thống sử dụng hai loại database. SQL Server (Relational Database) được sử dụng để lưu trữ thông tin người dùng bao gồm User accounts và Roles thông qua ASP.NET Identity. MongoDB Atlas (NoSQL Cloud Database) được sử dụng để lưu trữ dữ liệu nghiệp vụ bao gồm Projects, TodoLists, TodoItems và UserApps.

#### Về mặt phi chức năng

a) Hiệu năng (Performance)

Thời gian load trang dưới 3 giây. API response time dưới 500ms.

b) Bảo mật (Security)

Xác thực JWT với thời hạn token. Mã hóa mật khẩu với hashing. Validate input để chống các tấn công phổ biến.

c) Khả năng mở rộng (Scalability)

Thiết kế kiến trúc module hóa. Sử dụng cloud database (MongoDB Atlas) để dễ dàng mở rộng.

d) Trải nghiệm người dùng (UX)

Giao diện trực quan, dễ sử dụng. Responsive trên các thiết bị khác nhau. Phản hồi real-time khi thao tác.

## 1.3. Phạm vi đồ án

### 1.3.1. Phạm vi thực hiện

Đối tượng người dùng: Người dùng cá nhân muốn quản lý công việc và tạo ứng dụng riêng.

Nền tảng: Web Application, hỗ trợ các trình duyệt Chrome, Firefox, Edge.

Loại ứng dụng có thể tạo: TodoList, Dashboard, Form, Simple Apps.

Ngôn ngữ giao diện: Tiếng Việt.

### 1.3.2. Giới hạn đồ án

Đồ án không hỗ trợ ứng dụng mobile native. Hệ thống không có tính năng real-time collaboration. Chưa tích hợp thanh toán cho Marketplace. Số lượng component trong App Builder giới hạn ở mức cơ bản.

## 1.4. Công nghệ sử dụng

### 1.4.1. Frontend

React.js phiên bản 18.x được sử dụng để xây dựng UI components. Vite phiên bản 5.x làm build tool và dev server. TailwindCSS phiên bản 3.x cho styling và responsive design. React Router phiên bản 6.x cho client-side routing. Axios cho HTTP client để gọi API.

### 1.4.2. Backend

ASP.NET Core phiên bản 9.0 làm Web API framework. Entity Framework Core phiên bản 9.x làm ORM cho SQL Server. MongoDB.Driver cho kết nối MongoDB. ASP.NET Identity cho Authentication và Authorization. AutoMapper cho object-object mapping.

### 1.4.3. Database

SQL Server (Relational Database) lưu trữ User accounts và Roles. MongoDB Atlas (NoSQL Cloud Database) lưu trữ Projects, Apps, TodoLists.

### 1.4.4. Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình Client-Server. Frontend (React/Vite) giao tiếp với Backend (ASP.NET Core) thông qua HTTP/REST API. Backend được chia thành hai phần chính: phần Identity (Authentication) kết nối với SQL Server để quản lý Users và Roles; phần Business Logic kết nối với MongoDB Atlas để quản lý Projects, TodoLists và UserApps.

## 1.5. Kết quả dự kiến

Sau khi hoàn thành đồ án, hệ thống NEXUS-403 sẽ đạt được:

Thứ nhất, hệ thống web hoàn chỉnh với đầy đủ chức năng xác thực, App Builder, My App, Marketplace.

Thứ hai, App Builder trực quan cho phép người dùng kéo-thả tạo ứng dụng mà không cần code.

Thứ ba, Marketplace hoạt động nơi người dùng có thể chia sẻ và tải ứng dụng.

Thứ tư, tài liệu đầy đủ bao gồm hướng dẫn cài đặt, sử dụng và API documentation.

Thứ năm, code chất lượng tuân thủ các best practices và design patterns.

## 1.6. Bố cục báo cáo

Chương 1: Giới thiệu đề tài và mục tiêu đồ án.

Chương 2: Cơ sở lý thuyết và công nghệ sử dụng.

Chương 3: Phân tích và thiết kế hệ thống.

Chương 4: Triển khai và cài đặt.

Chương 5: Kiểm thử và đánh giá.

Chương 6: Kết luận và hướng phát triển.
