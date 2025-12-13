# Mô Tả Chức Năng & Preview - NEXUS-403

Tài liệu này mô tả các chức năng chính của hệ thống NEXUS-403 kèm hướng dẫn chụp ảnh preview cho báo cáo.

---

## Mục lục

1. [Danh sách ảnh cần chụp](#1-danh-sách-ảnh-cần-chụp)
2. [Mô tả chi tiết từng trang](#2-mô-tả-chi-tiết-từng-trang)
3. [Luồng hoạt động chính](#3-luồng-hoạt-động-chính)
4. [Tính năng nổi bật](#4-tính-năng-nổi-bật)

---

## 1. Danh sách ảnh cần chụp

### 1.1. Trang Đăng Nhập (Login Page)

**Ảnh:** Form đăng nhập với các trường email, password và nút "Đăng nhập với Google"

**Mô tả ngắn:**
> Hệ thống hỗ trợ đăng nhập bằng email/password hoặc Google OAuth 2.0. Giao diện đơn giản, thân thiện với người dùng, có liên kết đến trang đăng ký cho người dùng mới.

**Đường dẫn:** `/login`

---

### 1.2. Trang Đăng Ký (Register Page)

**Ảnh:** Form đăng ký với các trường email, password, confirm password và nút đăng ký

**Mô tả ngắn:**
> Người dùng có thể tạo tài khoản mới bằng cách nhập email và mật khẩu. Hệ thống yêu cầu xác nhận mật khẩu để đảm bảo tính chính xác. Sau khi đăng ký thành công, người dùng sẽ được chuyển đến trang My Apps.

**Đường dẫn:** `/register`

---

### 1.3. Trang My Apps (Trang chủ)

**Ảnh:** Grid view hiển thị các ứng dụng với cards, có thanh tìm kiếm và nút "Create App", "Marketplace"

**Mô tả ngắn:**
> Trang quản lý ứng dụng cá nhân của người dùng. Hiển thị tất cả ứng dụng đã tạo hoặc đã cài đặt từ Marketplace dưới dạng grid hoặc list. Mỗi card hiển thị tên, mô tả, ngày tạo và trạng thái (Published/Draft). Người dùng có thể tìm kiếm, mở, chỉnh sửa hoặc xóa ứng dụng. Có thống kê tổng số apps, số apps đã publish và số drafts.

**Đường dẫn:** `/`

**Chức năng chính:**
- Xem danh sách ứng dụng (grid/list view)
- Tìm kiếm ứng dụng
- Mở ứng dụng (chuyển đến Runtime)
- Chỉnh sửa ứng dụng (chuyển đến App Builder)
- Xóa ứng dụng
- Tạo ứng dụng mới
- Thống kê (tổng apps, published, drafts)

---

### 1.4. Trang App Builder List

**Ảnh:** Danh sách các projects với nút "Tạo Project Mới"

**Mô tả ngắn:**
> Trang quản lý các projects trong App Builder. Người dùng có thể xem danh sách tất cả projects, tạo project mới, mở project để chỉnh sửa hoặc xóa project không cần thiết.

**Đường dẫn:** `/app-builder`

---

### 1.5. Trang App Builder Editor

**Ảnh:** Giao diện App Builder với Toolbox bên trái, Canvas ở giữa, Properties Panel bên phải, có các components đã được kéo thả

**Mô tả ngắn:**
> Công cụ no-code chính của hệ thống, cho phép người dùng tạo ứng dụng bằng cách kéo thả components từ Toolbox vào Canvas. Toolbox được chia thành 5 nhóm: Layout, Display, Form, Data, và Control. Properties Panel cho phép cấu hình props, style, layout, data binding và events cho từng component. Hỗ trợ Undo/Redo, Preview mode và Publish lên Marketplace.

**Đường dẫn:** `/app-builder/:projectId`

**Chức năng chính:**
- Kéo thả components từ Toolbox vào Canvas
- Di chuyển và resize components
- Cấu hình components qua Properties Panel
- Undo/Redo (history management)
- Preview mode
- Save project (auto-save)
- Publish project

**Components có sẵn:**
- **Layout:** Container, Row, Grid, Divider
- **Display:** Text, Card, Image
- **Form:** Input, Button, Checkbox, Select, DatePicker
- **Data:** Database, TaskTable, TaskList, TaskBoard, TaskCalendar, ViewSwitcher, FilterBar, SearchBox, SortDropdown
- **Control:** AddTaskButton, Switch, DatabaseTitle

---

### 1.6. Trang App Runtime (Chạy ứng dụng)

**Ảnh:** Ứng dụng đang chạy ở chế độ runtime, ví dụ Todo List với các tasks, có header với nút fullscreen và hide header

**Mô tả ngắn:**
> Môi trường chạy ứng dụng đã được tạo hoặc cài đặt. Ứng dụng được render đầy đủ với tất cả components và tương tác. Người dùng có thể sử dụng ứng dụng như một ứng dụng web thực sự. Hỗ trợ fullscreen mode và ẩn/hiện header để có trải nghiệm tốt hơn.

**Đường dẫn:** `/app/:projectId`

**Chức năng chính:**
- Render ứng dụng ở chế độ runtime
- Tương tác với components (click, input, etc.)
- Xử lý events (onClick, onChange, etc.)
- Fullscreen mode
- Hide/Show header
- Quay lại My Apps

---

### 1.7. Trang Marketplace

**Ảnh:** Grid view hiển thị các ứng dụng trên Marketplace với filter theo category, search box, và nút "Install" trên mỗi app card

**Mô tả ngắn:**
> Chợ ứng dụng nơi người dùng có thể khám phá, tìm kiếm và cài đặt các ứng dụng do cộng đồng chia sẻ. Hiển thị danh sách ứng dụng với thông tin tên, mô tả, category, author. Người dùng có thể lọc theo category, tìm kiếm theo tên, xem chi tiết và preview ứng dụng trước khi cài đặt. Apps đã cài đặt sẽ hiển thị badge "Installed".

**Đường dẫn:** `/marketplace`

**Chức năng chính:**
- Duyệt danh sách ứng dụng (grid/list view)
- Tìm kiếm ứng dụng
- Lọc theo category
- Xem chi tiết ứng dụng (modal)
- Preview ứng dụng (read-only)
- Cài đặt ứng dụng
- Hiển thị trạng thái "Installed"

---

### 1.8. Trang Marketplace Preview

**Ảnh:** Preview ứng dụng ở chế độ read-only với thông tin app và nút "Install"

**Mô tả ngắn:**
> Xem trước ứng dụng từ Marketplace ở chế độ read-only. Người dùng có thể xem cách ứng dụng hoạt động trước khi quyết định cài đặt. Hiển thị đầy đủ thông tin về ứng dụng bao gồm tên, mô tả, category, author và nút cài đặt.

**Đường dẫn:** `/marketplace/preview/:appId`

---

### 1.9. Trang Dashboard

**Ảnh:** Bảng điều khiển với các thống kê (tổng projects, published apps, installed apps) và quick actions

**Mô tả ngắn:**
> Trang tổng quan hiển thị thống kê về hoạt động của người dùng. Bao gồm tổng số projects, số apps đã publish, số apps đã cài đặt, và các thống kê theo thời gian. Có các quick actions để nhanh chóng tạo app mới hoặc truy cập Marketplace.

**Đường dẫn:** `/dashboard`

---

### 1.10. Trang Admin Panel

**Ảnh:** Giao diện quản trị với danh sách users, có các nút khóa/mở khóa, xóa user

**Mô tả ngắn:**
> Trang quản trị dành cho Admin để quản lý toàn bộ hệ thống. Cho phép xem danh sách tất cả người dùng, khóa/mở khóa tài khoản, xóa người dùng. Quản lý Marketplace apps và categories. Xem thống kê hệ thống tổng quan.

**Đường dẫn:** `/admin`

**Chức năng chính:**
- Quản lý người dùng (xem, khóa/mở khóa, xóa)
- Quản lý Marketplace apps
- Quản lý Categories
- Xem thống kê hệ thống

---

### 1.11. Trang Settings

**Ảnh:** Form cài đặt với các tab: Profile, Security, Preferences

**Mô tả ngắn:**
> Trang cài đặt cho phép người dùng quản lý thông tin tài khoản, đổi mật khẩu, cấu hình các tùy chọn cá nhân. Có thể kết nối với các dịch vụ bên thứ ba như Google Calendar.

**Đường dẫn:** `/settings`

**Chức năng chính:**
- Quản lý thông tin profile
- Đổi mật khẩu
- Cài đặt ứng dụng (theme, ngôn ngữ)
- Kết nối dịch vụ bên thứ ba

---

## 2. Mô tả chi tiết từng trang

### 2.1. Authentication & Authorization

#### Đăng ký (Register)
- **Mục đích:** Tạo tài khoản mới cho người dùng
- **Các trường:** Email, Password, Confirm Password
- **Validation:** 
  - Email phải hợp lệ
  - Password tối thiểu 6 ký tự
  - Confirm Password phải khớp với Password
- **Luồng:** Nhập thông tin → Validate → Gửi request → Tạo tài khoản → Chuyển đến Login

#### Đăng nhập (Login)
- **Mục đích:** Xác thực người dùng và cấp quyền truy cập
- **Phương thức:**
  - Email/Password: Nhập email và password
  - Google OAuth: Đăng nhập bằng tài khoản Google
- **Luồng:** Nhập thông tin → Validate → Gửi request → Nhận JWT token → Lưu token → Chuyển đến My Apps

#### Đăng xuất (Logout)
- **Mục đích:** Kết thúc phiên làm việc
- **Luồng:** Click Logout → Xóa token → Chuyển đến Login

---

### 2.2. My Apps Page

#### Tổng quan
Trang chủ của hệ thống sau khi đăng nhập, nơi người dùng quản lý tất cả ứng dụng của mình.

#### Chức năng chi tiết

**1. Hiển thị danh sách ứng dụng**
- **Grid View:** Hiển thị dưới dạng cards với preview nhỏ
- **List View:** Hiển thị dưới dạng danh sách chi tiết
- **Thông tin hiển thị:** Tên, mô tả, ngày tạo, trạng thái (Published/Draft), số components

**2. Tìm kiếm**
- Tìm kiếm theo tên hoặc mô tả
- Real-time search khi gõ

**3. Thao tác với ứng dụng**
- **Mở:** Click vào card → Chuyển đến App Runtime
- **Chỉnh sửa:** Click nút Edit → Chuyển đến App Builder
- **Xóa:** Click nút Delete → Xác nhận → Xóa project

**4. Tạo ứng dụng mới**
- Click "Create App" → Chuyển đến App Builder với project mới

**5. Thống kê**
- Tổng số apps
- Số apps đã publish
- Số drafts

---

### 2.3. App Builder

#### Tổng quan
Công cụ no-code chính của hệ thống, cho phép người dùng tạo ứng dụng bằng cách kéo thả components.

#### Cấu trúc giao diện

**1. Toolbox (Bên trái)**
- Chứa tất cả components có sẵn
- Được chia thành 5 categories:
  - **Layout:** Container, Row, Grid, Divider
  - **Display:** Text, Card, Image
  - **Form:** Input, Button, Checkbox, Select, DatePicker
  - **Data:** Database, TaskTable, TaskList, TaskBoard, TaskCalendar, ViewSwitcher, FilterBar, SearchBox, SortDropdown
  - **Control:** AddTaskButton, Switch, DatabaseTitle

**2. Canvas (Giữa)**
- Vùng làm việc chính
- Hỗ trợ drag & drop
- Hiển thị components đã thêm
- Grid background để căn chỉnh

**3. Properties Panel (Bên phải)**
- Hiển thị khi chọn component
- Các tab:
  - **Props:** Cấu hình thuộc tính (label, placeholder, etc.)
  - **Style:** Cấu hình giao diện (màu, padding, margin, border, etc.)
  - **Layout:** Cấu hình bố cục (width, height, position, etc.)
  - **Data:** Cấu hình data binding
  - **Events:** Cấu hình sự kiện (onClick, onChange, etc.)
  - **Conditions:** Cấu hình điều kiện hiển thị

#### Chức năng chi tiết

**1. Kéo thả components**
- Kéo component từ Toolbox vào Canvas
- Tự động tạo component mới
- Hỗ trợ drop vào layout components (Container, Row, Grid)

**2. Di chuyển components**
- **Root components:** Di chuyển tự do trên Canvas (absolute positioning)
- **Layout children:** Sắp xếp lại trong layout (flow layout)

**3. Resize components**
- Chỉ áp dụng cho root components
- Kéo góc hoặc cạnh để resize
- Giữ tỷ lệ với Shift

**4. Cấu hình components**
- Chọn component → Properties Panel hiển thị
- Cấu hình props, style, layout, data, events
- Thay đổi được áp dụng ngay lập tức

**5. Undo/Redo**
- Lưu snapshot sau mỗi thao tác quan trọng
- Undo: Ctrl+Z hoặc nút Undo
- Redo: Ctrl+Y hoặc nút Redo

**6. Preview mode**
- Chuyển sang chế độ preview
- Ẩn các controls (resize handles, selection)
- Xem ứng dụng như người dùng cuối

**7. Save project**
- Auto-save sau mỗi thay đổi
- Manual save: Ctrl+S hoặc nút Save
- Hiển thị thông báo khi save thành công

**8. Publish project**
- Click nút "Publish"
- Điền thông tin: Name, Description, Category, Price
- Gửi request → Project được đánh dấu IsPublished = true
- App xuất hiện trên Marketplace

---

### 2.4. App Runtime

#### Tổng quan
Môi trường chạy ứng dụng đã được tạo hoặc cài đặt, cho phép người dùng sử dụng ứng dụng như một ứng dụng web thực sự.

#### Chức năng chi tiết

**1. Render ứng dụng**
- Parse JSON data từ project
- Render tất cả components
- Áp dụng style và layout
- Kích hoạt events

**2. Tương tác**
- Click buttons → Trigger onClick events
- Nhập input → Trigger onChange events
- Tất cả tương tác hoạt động như ứng dụng thực

**3. Fullscreen mode**
- Click nút Fullscreen → Ẩn browser UI
- Tập trung vào ứng dụng
- Exit fullscreen: ESC hoặc nút Exit

**4. Hide/Show header**
- Ẩn header để có không gian lớn hơn
- Hiển thị nút "Show Header" khi ẩn

**5. Navigation**
- Nút "Back" → Quay lại My Apps
- Nút "Home" → Về trang chủ

---

### 2.5. Marketplace

#### Tổng quan
Chợ ứng dụng nơi người dùng có thể khám phá, tìm kiếm và cài đặt các ứng dụng do cộng đồng chia sẻ.

#### Chức năng chi tiết

**1. Duyệt ứng dụng**
- Grid/List view
- Hiển thị: Tên, mô tả, category, author, price
- Badge "Installed" cho apps đã cài

**2. Tìm kiếm**
- Search box ở đầu trang
- Tìm theo tên hoặc mô tả
- Real-time search

**3. Lọc theo category**
- Dropdown chọn category
- "All" để hiển thị tất cả
- Filter ngay lập tức

**4. Xem chi tiết**
- Click vào app card → Modal hiển thị
- Thông tin chi tiết: Tên, mô tả, category, author, price
- Nút "Preview" để xem trước
- Nút "Install" để cài đặt

**5. Preview ứng dụng**
- Xem trước ở chế độ read-only
- Không thể chỉnh sửa
- Đánh giá trước khi cài đặt

**6. Cài đặt ứng dụng**
- Click "Install" → Xác nhận
- Tạo Project mới từ Marketplace app
- App xuất hiện trong My Apps
- Thông báo thành công

**7. Publish ứng dụng**
- Từ App Builder → Click "Publish"
- Điền thông tin → Submit
- App xuất hiện trên Marketplace

---

### 2.6. Admin Panel

#### Tổng quan
Trang quản trị dành cho Admin để quản lý toàn bộ hệ thống.

#### Chức năng chi tiết

**1. Quản lý người dùng**
- Xem danh sách tất cả users
- Thông tin: Email, Username, Role, Status
- **Khóa/Mở khóa:** Click nút Lock/Unlock
- **Xóa:** Click nút Delete → Xác nhận

**2. Quản lý Marketplace**
- Xem danh sách apps đã publish
- Xóa app khỏi marketplace
- Quản lý categories

**3. Quản lý Categories**
- Tạo category mới
- Sửa category
- Xóa category

**4. Thống kê hệ thống**
- Tổng số users
- Tổng số apps
- Số apps đã publish
- Hoạt động gần đây

---

### 2.7. Settings

#### Tổng quan
Trang cài đặt cho phép người dùng quản lý thông tin tài khoản và cấu hình các tùy chọn cá nhân.

#### Chức năng chi tiết

**1. Profile**
- Xem thông tin: Email, Username
- Cập nhật thông tin

**2. Security**
- Đổi mật khẩu
- Xác thực 2 bước (nếu có)

**3. Preferences**
- Theme (Light/Dark)
- Ngôn ngữ (nếu có)

**4. Integrations**
- Kết nối Google Calendar
- Kết nối các dịch vụ khác

---

## 3. Luồng hoạt động chính

### 3.1. Luồng tạo và publish ứng dụng

```
1. Đăng nhập → My Apps
2. Click "Create App" → App Builder
3. Kéo thả components vào Canvas
4. Cấu hình components qua Properties Panel
5. Preview ứng dụng
6. Save project
7. Publish lên Marketplace (tùy chọn)
8. Quay lại My Apps → App xuất hiện
```

### 3.2. Luồng cài đặt ứng dụng từ Marketplace

```
1. Đăng nhập → Marketplace
2. Duyệt/Tìm kiếm ứng dụng
3. Click vào app → Xem chi tiết
4. Preview ứng dụng (tùy chọn)
5. Click "Install"
6. Xác nhận cài đặt
7. App được thêm vào My Apps
8. Mở app từ My Apps → Sử dụng
```

### 3.3. Luồng sử dụng ứng dụng

```
1. Đăng nhập → My Apps
2. Click vào app card → App Runtime
3. Sử dụng ứng dụng (tương tác với components)
4. Fullscreen mode (tùy chọn)
5. Quay lại My Apps
```

---

## 4. Tính năng nổi bật

### 4.1. No-Code Development
- Tạo ứng dụng không cần viết code
- Kéo thả components trực quan
- Cấu hình qua Properties Panel

### 4.2. Drag & Drop
- Kéo thả components từ Toolbox vào Canvas
- Di chuyển components trên Canvas
- Sắp xếp lại trong layout components

### 4.3. Real-time Preview
- Preview ngay trong App Builder
- Preview trước khi publish
- Preview trong Marketplace

### 4.4. Component Library
- 20+ components có sẵn
- 5 categories: Layout, Display, Form, Data, Control
- Dễ dàng mở rộng

### 4.5. Marketplace
- Chia sẻ ứng dụng với cộng đồng
- Cài đặt ứng dụng từ cộng đồng
- Quản lý categories

### 4.6. History Management
- Undo/Redo trong App Builder
- Auto-save project
- Không mất dữ liệu

### 4.7. Responsive Design
- Tương thích mobile
- Adaptive layout
- Touch-friendly

### 4.8. Security
- JWT authentication
- Google OAuth 2.0
- Role-based access control

---

## 5. Hướng dẫn chụp ảnh

### 5.1. Yêu cầu chung
- **Độ phân giải:** Tối thiểu 1920x1080
- **Format:** PNG hoặc JPG
- **Chất lượng:** High quality
- **Nội dung:** Hiển thị đầy đủ chức năng, không bị cắt

### 5.2. Gợi ý cho từng ảnh

**Login Page:**
- Chụp toàn bộ form
- Hiển thị cả nút "Đăng nhập với Google"
- Có thể thêm placeholder text trong các input

**My Apps:**
- Chụp với ít nhất 3-4 app cards
- Hiển thị cả thanh tìm kiếm và nút "Create App"
- Có thể chụp cả thống kê ở trên

**App Builder:**
- Chụp toàn bộ giao diện (Toolbox + Canvas + Properties Panel)
- Có ít nhất 3-4 components đã được kéo thả
- Properties Panel đang mở với component được chọn

**App Runtime:**
- Chụp ứng dụng đang chạy (ví dụ Todo List với tasks)
- Hiển thị header với các nút
- Có thể chụp ở fullscreen mode

**Marketplace:**
- Chụp với ít nhất 4-6 app cards
- Hiển thị filter và search box
- Có thể chụp modal chi tiết app

**Admin Panel:**
- Chụp danh sách users
- Hiển thị các nút quản lý (Lock, Delete)
- Có thể chụp thống kê

---

## 6. Checklist trước khi chụp ảnh

- [ ] Đảm bảo ứng dụng đang chạy ổn định
- [ ] Chuẩn bị dữ liệu mẫu (apps, users, etc.)
- [ ] Kiểm tra giao diện không có lỗi
- [ ] Đảm bảo các chức năng hoạt động đúng
- [ ] Chuẩn bị các trường hợp sử dụng khác nhau
- [ ] Kiểm tra responsive trên các kích thước màn hình

---

**Lưu ý:** Tài liệu này sẽ được cập nhật khi có thêm chức năng mới hoặc thay đổi giao diện.
