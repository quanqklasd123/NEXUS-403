**###  Lộ trình Phát triển NEXUS (Giai đoạn Platform)

#### 1️⃣ Bước 1: Xây dựng Backend "Lưu trữ Dự án"

Mục tiêu: Tạo bảng CSDL Projects để lưu các app mà user đang làm dở (chưa publish). Tạo API để Tạo, Sửa, Xóa, Lấy danh sách Project. Prompt 1:

Hãy bắt đầu Giai đoạn 1: Xây dựng Backend lưu trữ Project.

1. Tạo Model Project.cs trong thư mục Models (gồm Id, Name, Description, JsonData, AppUserId, IsPublished, CreatedAt).
2. Tạo DTO ProjectDTO.cs và CreateProjectDTO.cs.
3. Cập nhật TodoContext và chạy Migrations để tạo bảng.
4. Tạo ProjectsController.cs với các API CRUD đầy đủ:
   * GET /api/projects (Lấy danh sách của user)
   * GET /api/projects/{id} (Lấy chi tiết để mở trong builder)
   * POST /api/projects (Tạo mới)
   * PUT /api/projects/{id} (Lưu lại các thay đổi canvas)
   * DELETE /api/projects/{id}

#### 2️⃣ Bước 2: Hiển thị "My Projects" trên Dashboard

Mục tiêu: Khi user đăng nhập, họ phải thấy các dự án đang làm dở của mình trên Dashboard (bên cạnh các thống kê cũ). Prompt 2:

Tiếp theo Giai đoạn 2: Hiển thị Project trên Dashboard.

1. Cập nhật apiService.js: Thêm các hàm gọi API Projects (getProjects, createProject, deleteProject...).
2. Cập nhật DashboardPage.jsx:
   * Thêm một section mới "My Projects" bên dưới phần "Quick Stats".
   * Hiển thị danh sách các project lấy từ API dưới dạng Grid (tương tự như App Mini Card).
   * Thêm nút "New Project" để gọi API tạo project mới và chuyển hướng sang trang Builder.

#### 3️⃣ Bước 3: Kết nối App Builder với Database (Lưu/Tải)

Mục tiêu: App Builder không còn là trang tĩnh. Nó phải tải dữ liệu thật từ API khi mở, và nút "Save" phải lưu vào CSDL thật. Prompt 3:

Giai đoạn 3: Kết nối App Builder với Database.

1. Cập nhật App.jsx: Sửa route /builder thành /builder/:projectId để nó biết đang mở dự án nào.
2. Nâng cấp AppBuilderPage.jsx:
   * Dùng useEffect và useParams để tải dữ liệu canvas (JsonData) từ API GET /projects/{id} khi trang vừa mở.
   * Cập nhật nút "Save App" để gọi API PUT /api/projects/{id} và lưu toàn bộ canvasItems hiện tại vào CSDL.

#### 4️⃣ Bước 4: Mở rộng Kho Công cụ (Toolbox Items)

Mục tiêu: Thêm các component "xịn" hơn vào Builder như Grid, Card, Chart, Divider... như bạn yêu cầu. Prompt 4:

Giai đoạn 4: Nâng cấp Toolbox cho App Builder. Hãy thêm các công cụ mới vào biến TOOLS và cập nhật RenderComponent trong AppBuilderPage.jsx để hỗ trợ chúng:

1. Layout:Row (Flex container ngang), Divider (Đường kẻ).
2. Display:Card (Container có shadow/border), Chart (Biểu đồ giả lập).
3. Form:Checkbox, Select (Dropdown). Đảm bảo các component này có defaultStyle hợp lý và có thể chỉnh sửa được trong PropertiesPanel.

#### 5️⃣ Bước 5: Quy trình "Publish" chuyên nghiệp

Mục tiêu: Hoàn thiện luồng: Project (Private) -> Publish -> Marketplace App (Public). Prompt 5:

Giai đoạn 5: Hoàn thiện quy trình Publish.

1. Cập nhật ProjectsController: Thêm API POST /api/projects/{id}/publish. API này sẽ lấy dữ liệu của Project đó, tạo một bản sao bên bảng MarketplaceApps (hoặc đánh dấu IsPublished = true), và trả về thành công.
2. Cập nhật Modal Publish trong AppBuilderPage.jsx để gọi API publish mới này thay vì API cũ.

**
