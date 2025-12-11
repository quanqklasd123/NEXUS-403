# Hướng dẫn tạo App giống Notion trong App Builder

## ✅ Xác nhận: Bạn có thể tạo app giống Notion!

Với tất cả các components đã được implement, bạn hoàn toàn có thể tự tạo một app TodoList database giống Notion bằng cách **kéo thả và cấu hình**.

---

## 🎯 Các bước tạo App

### Bước 1: Tạo Project mới

1. Vào **Dashboard** (`/dashboard`)
2. Click nút **"Tạo App Mới"**
3. Nhập thông tin:
   - **Tên App**: `My Todo Database` (hoặc tên bạn muốn)
   - **Mô tả**: `Task management app giống Notion`
4. Click **"Tạo"**
5. Tự động chuyển sang App Builder (`/builder/{projectId}`)

---

### Bước 2: Kéo thả Components

**Thứ tự kéo thả (từ trên xuống dưới):**

#### 2.1. Database Title (Tiêu đề)
- Từ **Toolbox** → category **Control**
- Kéo `Database Title` vào Canvas
- Đặt ở vị trí trên cùng

#### 2.2. Row Container (Chứa các controls)
- Từ **Toolbox** → category **Layout**
- Kéo `Row (Flex)` vào Canvas
- Đặt ngay dưới Database Title

#### 2.3. Control Components (Trong Row)
Kéo các components sau vào **trong Row** (bên cạnh nhau):

1. **View Switcher** (Control)
   - Icon: Table/List/Board/Calendar
   
2. **Search Box** (Control)
   - Ô tìm kiếm
   
3. **Sort Dropdown** (Control)
   - Dropdown sắp xếp
   
4. **Filter Bar** (Control)
   - Thanh lọc
   
5. **Add Task Button** (Control)
   - Nút thêm task

#### 2.4. Data Component (Hiển thị dữ liệu)
Chọn **1 trong 4** tùy theo view bạn muốn:

- **Task Table** (Data) - Bảng dạng Table
- **Task List** (Data) - Danh sách với checkbox
- **Task Board** (Data) - Kanban board
- **Task Calendar** (Data) - Calendar view

Kéo vào Canvas, đặt dưới Row chứa controls.

---

### Bước 3: Cấu hình Components

Click vào từng component và cấu hình trong **Properties Panel**:

#### 3.1. Database Title
- **Label**: `My Tasks`
- **Icon**: `📋` (hoặc emoji bạn thích)
- **Editable**: ✅ (cho phép chỉnh sửa)

#### 3.2. View Switcher
- **Views**: Chọn `table`, `list`, `board`, `calendar`
- **Default View**: `table`
- **Target Component ID**: Chọn ID của TaskTable (để chuyển view)

#### 3.3. Search Box
- **Placeholder**: `Search tasks...`
- **Target Component ID**: Chọn ID của TaskTable

#### 3.4. Sort Dropdown
- **Sort Fields**: Chọn các field cần sort (`title`, `status`, `priority`, `dueDate`)
- **Default Sort**: `title` - `asc`
- **Target Component ID**: Chọn ID của TaskTable

#### 3.5. Filter Bar
- **Filter Fields**: Chọn `status`, `priority`, `dueDate`
- **Target Component ID**: Chọn ID của TaskTable

#### 3.6. Add Task Button
- **Label**: `+ New Task`
- **Default Status**: `Todo`
- **Default Priority**: `Medium`
- **Todo List ID**: `null` (tất cả tasks) hoặc ID cụ thể

#### 3.7. Task Table (hoặc component Data khác)
- **Columns**: Chọn `title`, `status`, `priority`, `dueDate`
- **Show Header**: ✅
- **Allow Edit**: ✅
- **Allow Delete**: ✅
- **Todo List ID**: `null` (tất cả tasks)

---

### Bước 4: Lưu Project

1. Click nút **"Save"** trên **Canvas Toolbar** (góc trên bên phải)
2. Project được lưu tự động vào database
3. Có thể tắt tab, khi quay lại vẫn giữ nguyên layout

---

### Bước 5: Preview (Xem trước)

1. Click nút **"Preview"** trên toolbar
2. Test các chức năng:
   - Search tasks
   - Filter theo status/priority
   - Sort tasks
   - Thêm task mới
   - Chỉnh sửa task
   - Xóa task

---

### Bước 6: Publish (Tùy chọn)

Nếu muốn chia sẻ app lên Marketplace:

1. Click nút **"Publish"** trên toolbar
2. Điền thông tin:
   - **Tên app**: `My Todo Database`
   - **Mô tả**: Mô tả app
   - **Tags**: `todo`, `productivity`, `notion`
   - **Screenshot**: Upload ảnh (nếu có)
3. Click **"Publish App"**
4. App sẽ xuất hiện trên Marketplace

---

## 📐 Layout Mẫu (Giống Notion)

```
┌─────────────────────────────────────────────────────┐
│  📋 My Tasks Database              [Edit]           │  ← DatabaseTitle
├─────────────────────────────────────────────────────┤
│  [📊][📋][📑][📅] [🔍 Search...] [🔽 Sort] [🎚️]    │  ← Row Container
│                                    [+ New Task]      │     (ViewSwitcher, SearchBox, SortDropdown,
│                                                       │      FilterBar, AddTaskButton)
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Title        │ Status │ Priority │ Due Date  │ │  ← TaskTable
│  ├───────────────────────────────────────────────┤ │
│  │ Design UI    │ Todo   │ High     │ 2025-12-10│ │
│  │ Code API     │ Doing  │ Medium   │ 2025-12-15│ │
│  │ Test App     │ Done   │ Low      │ 2025-12-08│ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Tính năng đã có sẵn

### ✅ Data Components (4/4)
- **TaskTable**: Bảng với inline editing
- **TaskList**: Danh sách với checkbox
- **TaskBoard**: Kanban board drag & drop
- **TaskCalendar**: Calendar view

### ✅ Control Components (6/6)
- **ViewSwitcher**: Chuyển đổi Table/List/Board/Calendar
- **FilterBar**: Filter theo Status/Priority/DueDate
- **SearchBox**: Tìm kiếm tasks
- **SortDropdown**: Sắp xếp theo field
- **AddTaskButton**: Tạo task mới
- **DatabaseTitle**: Tiêu đề database (editable)

### ✅ Event System
- Components giao tiếp với nhau qua EventBus
- Search → Filter Data components
- Filter → Update Data components
- Sort → Reorder Data components
- ViewSwitcher → Switch Data view

### ✅ Properties Panel
- Cấu hình đầy đủ cho từng component
- Settings UI thân thiện
- Real-time preview

---

## 💡 Tips

1. **Bắt đầu đơn giản**: Tạo app với TaskTable trước, sau đó thêm các controls
2. **Test thường xuyên**: Dùng Preview để kiểm tra từng bước
3. **Layout linh hoạt**: Có thể dùng Container/Row để sắp xếp components
4. **Kết hợp nhiều views**: Có thể có cả TaskTable và TaskBoard, dùng ViewSwitcher để chuyển đổi

---

## 🚀 Kết luận

**Có! Bạn hoàn toàn có thể tạo app giống Notion!**

Tất cả các components cần thiết đã sẵn sàng:
- ✅ Data components để hiển thị tasks
- ✅ Control components để điều khiển
- ✅ Event system để kết nối
- ✅ Properties panel để cấu hình

Chỉ cần:
1. **Kéo thả** components vào Canvas
2. **Cấu hình** qua Properties Panel
3. **Lưu** và sử dụng!

Happy building! 🎉

