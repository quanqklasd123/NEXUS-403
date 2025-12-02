# Lộ trình thiết kế App TodoList giống Notion trong App Builder

## 1. Tổng quan
Mục tiêu: Xây dựng một ứng dụng TodoList trong App Builder với giao diện và chức năng tương tự Notion, bao gồm:
- Database dạng bảng (Table View)
- Các loại view: Table, Board (Kanban), Calendar, List
- Properties linh hoạt (Text, Select, Multi-select, Date, Checkbox, Person, ...)
- Filter, Sort, Group
- Inline editing
- Drag & Drop

---

## 1.1. Tái sử dụng dữ liệu có sẵn

### Dữ liệu đã có trong Database:

#### Bảng TodoItem (Model)
```csharp
public class TodoItem
{
    public long Id { get; set; }
    public string Title { get; set; }
    public string Status { get; set; }      // "Todo", "InProgress", "Done"
    public string Priority { get; set; }    // "Low", "Medium", "High"
    public DateTime? DueDate { get; set; }
    public long TodoListId { get; set; }
    public TodoList TodoList { get; set; }
}
```

#### Bảng TodoList (Model)
```csharp
public class TodoList
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string UserId { get; set; }
    public AppUser User { get; set; }
    public ICollection<TodoItem> Items { get; set; }
}
```

### API Endpoints có sẵn:
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/todoitems/my-all` | GET | Lấy tất cả tasks của user |
| `/api/todoitems/{id}` | GET | Lấy chi tiết 1 task |
| `/api/todoitems` | POST | Tạo task mới |
| `/api/todoitems/{id}` | PUT | Cập nhật task |
| `/api/todoitems/{id}` | DELETE | Xóa task |
| `/api/todoitems/{id}/status` | PATCH | Cập nhật status |
| `/api/todolists` | GET | Lấy danh sách lists |
| `/api/todolists/{id}` | GET | Lấy chi tiết list + items |
| `/api/dashboard/stats` | GET | Thống kê dashboard |

### Mapping dữ liệu có sẵn với Notion:
| Notion Property | Dữ liệu có sẵn | Ghi chú |
|-----------------|----------------|---------|
| Title | `TodoItem.Title` | ✅ Có sẵn |
| Status | `TodoItem.Status` | ✅ Có sẵn (Todo/InProgress/Done) |
| Priority | `TodoItem.Priority` | ✅ Có sẵn (Low/Medium/High) |
| Due Date | `TodoItem.DueDate` | ✅ Có sẵn |
| List/Project | `TodoItem.TodoListId` | ✅ Có sẵn |
| Assignee | ❌ Chưa có | Cần thêm field |
| Tags | ❌ Chưa có | Cần thêm bảng mới |
| Description | ❌ Chưa có | Cần thêm field |

### Cách tái sử dụng trong App Builder:
```jsx
// Trong component Database Table, gọi API có sẵn:
import apiService from '../services/apiService';

// Lấy tất cả tasks
const tasks = await apiService.getAllMyItems();

// Cập nhật status (dùng cho Kanban drag & drop)
await apiService.updateItemStatus(taskId, newStatus);

// Cập nhật task đầy đủ
await apiService.updateTodoItem(taskId, updatedData);

// Tạo task mới
await apiService.createTodoItem({ title, status, priority, dueDate, todoListId });

// Xóa task
await apiService.deleteTodoItem(taskId);
```

---

## 2. Các Components cần thiết

### 2.1. Database Table Component
- **Mô tả:** Hiển thị dữ liệu dạng bảng, mỗi hàng là 1 task, mỗi cột là 1 property.
- **Chức năng:**
  - Thêm/sửa/xóa row
  - Thêm/sửa/xóa column (property)
  - Inline editing (click vào ô để sửa)
  - Drag & drop row để sắp xếp
  - Resize column

### 2.2. Board/Kanban View Component
- **Mô tả:** Hiển thị task theo dạng cột (theo Status hoặc property khác).
- **Chức năng:**
  - Drag & drop card giữa các cột
  - Thêm card mới vào cột
  - Collapse/expand cột

### 2.3. Calendar View Component
- **Mô tả:** Hiển thị task trên lịch theo ngày.
- **Chức năng:**
  - Kéo thả task giữa các ngày
  - Xem theo tuần/tháng

### 2.4. List View Component
- **Mô tả:** Hiển thị task dạng danh sách đơn giản.
- **Chức năng:**
  - Checkbox hoàn thành
  - Inline editing title

### 2.5. Property Editor Component
- **Mô tả:** Cho phép cấu hình các property cho database.
- **Chức năng:**
  - Thêm/sửa/xóa property
  - Chọn loại property: Text, Number, Select, Multi-select, Date, Checkbox, Person, URL, Email, Phone, Formula, Relation, Rollup, ...

### 2.6. Filter & Sort Bar Component
- **Mô tả:** Thanh công cụ lọc và sắp xếp dữ liệu.
- **Chức năng:**
  - Thêm nhiều điều kiện filter
  - Sắp xếp theo nhiều cột
  - Lưu filter/sort preset

### 2.7. Group By Component
- **Mô tả:** Nhóm các task theo property (ví dụ: Status, Priority, Assignee).
- **Chức năng:**
  - Chọn property để group
  - Collapse/expand nhóm

### 2.8. Task Detail Modal/Panel Component
- **Mô tả:** Popup hoặc panel hiển thị chi tiết task khi click vào.
- **Chức năng:**
  - Hiển thị tất cả property
  - Cho phép chỉnh sửa inline
  - Thêm comment, attachment (nâng cao)

### 2.9. Toolbar Component
- **Mô tả:** Thanh công cụ chung cho database.
- **Chức năng:**
  - Chuyển view (Table/Board/Calendar/List)
  - Mở filter/sort
  - Search
  - New task

### 2.10. Select/Multi-select Dropdown Component
- **Mô tả:** Dropdown cho phép chọn 1 hoặc nhiều giá trị (có màu tag).
- **Chức năng:**
  - Thêm option mới
  - Chọn màu cho option
  - Tìm kiếm option

### 2.11. Date Picker Component
- **Mô tả:** Chọn ngày, có thể chọn khoảng ngày.
- **Chức năng:**
  - Chọn ngày đơn lẻ
  - Chọn khoảng ngày (start - end)
  - Chọn reminder (nâng cao)

### 2.12. Checkbox Component
- **Mô tả:** Ô checkbox đơn giản.
- **Chức năng:**
  - Đánh dấu hoàn thành task

### 2.13. Person/Assignee Picker Component
- **Mô tả:** Chọn người phụ trách.
- **Chức năng:**
  - Hiển thị avatar, tên
  - Tìm kiếm, chọn nhiều người

---

## 3. Lộ trình phát triển

### Giai đoạn 1: Nền tảng (Foundation)
1. **Database Table Component**: Hiển thị dữ liệu dạng bảng, inline editing, thêm/xóa row.
2. **Property Editor Component**: Thêm/sửa property cơ bản (Text, Checkbox, Date).
3. **Toolbar Component**: Chuyển view, nút thêm task.

### Giai đoạn 2: View đa dạng
4. **List View Component**: Hiển thị task dạng danh sách.
5. **Board/Kanban View Component**: Drag & drop card giữa cột.
6. **Calendar View Component**: Hiển thị task theo ngày.

### Giai đoạn 3: Tính năng nâng cao
7. **Filter & Sort Bar Component**: Lọc, sắp xếp dữ liệu.
8. **Group By Component**: Nhóm task theo property.
9. **Task Detail Modal/Panel Component**: Xem chi tiết task.

### Giai đoạn 4: UI/UX hoàn thiện
10. **Select/Multi-select Dropdown Component**: Tag màu sắc.
11. **Date Picker Component**: Chọn ngày, khoảng ngày.
12. **Person/Assignee Picker Component**: Giao việc cho người.

### Giai đoạn 5: Tính năng Notion nâng cao (Tuỳ chọn)
13. **Formula Property**: Tính toán tự động.
14. **Relation/Rollup Property**: Liên kết database.
15. **Comment/Attachment**: Bình luận, đính kèm file.
16. **Template**: Tạo template cho task/database.

---

## 4. Mapping với Notion

| Notion Feature         | Component tương ứng                |
|------------------------|------------------------------------|
| Database Table         | Database Table Component           |
| Board View             | Board/Kanban View Component        |
| Calendar View          | Calendar View Component            |
| List View              | List View Component                |
| Property (Text, Date)  | Property Editor Component          |
| Filter/Sort            | Filter & Sort Bar Component        |
| Group By               | Group By Component                 |
| Task Detail            | Task Detail Modal/Panel Component  |
| Select/Multi-select    | Select/Multi-select Dropdown       |
| Date Picker            | Date Picker Component              |
| Checkbox               | Checkbox Component                 |
| Person                 | Person/Assignee Picker Component   |

---

## 5. Gợi ý công nghệ
- **Drag & Drop:** react-beautiful-dnd, dnd-kit
- **Calendar:** react-big-calendar, FullCalendar
- **Date Picker:** react-datepicker, dayjs
- **Table:** react-table, TanStack Table
- **State Management:** Context, Zustand, Redux

---

## 6. Tổng kết
Bạn có thể bắt đầu từ giai đoạn 1, hoàn thiện từng component, sau đó ghép nối lại trong App Builder.  
Mỗi component nên tách riêng file, dễ tái sử dụng và bảo trì.

---

## 7. Prompt chi tiết cho từng giai đoạn

### Giai đoạn 0: Mở rộng Database (Tuỳ chọn)

#### Prompt 0.1: Thêm field Description cho TodoItem
```
Cập nhật Model TodoItem trong TodoApi/Models/TodoItem.cs:
- Thêm field: public string? Description { get; set; }

Cập nhật DTO CreateTodoItemDTO và TodoItemDTO:
- Thêm field Description

Tạo migration mới:
dotnet ef migrations add AddDescriptionToTodoItem
dotnet ef database update

Cập nhật TodoItemsController để xử lý field mới.
```

#### Prompt 0.2: Thêm bảng Tags (Multi-select)
```
Tạo Model mới TodoApi/Models/Tag.cs:
- Id, Name, Color, UserId

Tạo bảng trung gian TodoItemTag (many-to-many):
- TodoItemId, TagId

Cập nhật TodoItem để có ICollection<Tag> Tags

Tạo migration và cập nhật API để CRUD tags.
```

#### Prompt 0.3: Thêm field Assignee
```
Cập nhật Model TodoItem:
- Thêm field: public string? AssigneeId { get; set; }
- Thêm navigation: public AppUser? Assignee { get; set; }

Tạo migration và cập nhật API.
```

---

### Giai đoạn 1: Nền tảng (Foundation) - SỬ DỤNG DỮ LIỆU CÓ SẴN

#### Prompt 1.1: Database Table Component (Tái sử dụng dữ liệu)
```
Tạo component DatabaseTable trong src/components/builder/DatabaseTable.jsx với các tính năng:
- GỌI API CÓ SẴN: apiService.getAllMyItems() để lấy dữ liệu
- Hiển thị dữ liệu dạng bảng với các cột: Title, Status, Priority, Due Date
- Inline editing: click vào ô để sửa, gọi apiService.updateTodoItem() khi blur
- Nút thêm row mới: gọi apiService.createTodoItem()
- Xóa row: gọi apiService.deleteTodoItem()
- Cột Status hiển thị dạng tag màu (Todo=gray, InProgress=blue, Done=green)
- Cột Priority hiển thị dạng tag màu (Low=green, Medium=yellow, High=red)
- Sử dụng Tailwind CSS cho styling
- Props: todoListId (optional, để filter theo list)
```

#### Prompt 1.2: Property Editor Component
```
Tạo component PropertyEditor trong src/components/builder/PropertyEditor.jsx với các tính năng:
- Popup/Modal hiển thị danh sách các property hiện có
- Cho phép thêm property mới với các loại: Text, Number, Checkbox, Date, Select
- Cho phép đổi tên property
- Cho phép xóa property
- Cho phép thay đổi loại property
- Sử dụng Tailwind CSS cho styling
- Props: properties, onPropertiesChange
```

#### Prompt 1.3: Toolbar Component
```
Tạo component DatabaseToolbar trong src/components/builder/DatabaseToolbar.jsx với các tính năng:
- Hiển thị tên database (có thể inline edit)
- Các nút chuyển view: Table | Board | Calendar | List (chỉ UI, chưa cần logic)
- Nút Filter, Sort (chỉ UI, chưa cần logic)
- Nút Search với input tìm kiếm
- Nút "+ New" để thêm task mới
- Sử dụng Tailwind CSS, icon từ react-icons
- Props: title, activeView, onViewChange, onNewTask, onSearch
```

---

### Giai đoạn 2: View đa dạng

#### Prompt 2.1: List View Component (Tái sử dụng dữ liệu)
```
Tạo component ListView trong src/components/builder/ListView.jsx với các tính năng:
- GỌI API: apiService.getAllMyItems() hoặc nhận props tasks
- Hiển thị task dạng danh sách dọc
- Checkbox: click để toggle status (Todo <-> Done), gọi apiService.updateItemStatus()
- Click title để inline edit, gọi apiService.updateTodoItem() khi blur
- Hiển thị priority icon/badge bên cạnh title
- Hiển thị due date nếu có
- Hover hiện nút xóa, gọi apiService.deleteTodoItem()
- Filter theo todoListId nếu cần
- Sử dụng Tailwind CSS
- Props: todoListId (optional), tasks (optional - nếu đã fetch từ parent)
```

#### Prompt 2.2: Board/Kanban View Component (Tái sử dụng dữ liệu)
```
Tạo component BoardView trong src/components/builder/BoardView.jsx với các tính năng:
- GỌI API: apiService.getAllMyItems() để lấy tasks
- 3 cột cố định theo Status: "Todo", "InProgress", "Done"
- Mỗi card hiển thị: title, priority badge, due date
- Drag & drop card giữa cột: gọi apiService.updateItemStatus(taskId, newStatus)
- Nút "+ Add" ở mỗi cột: tạo task mới với status tương ứng
- Click card để mở TaskDetailModal
- Sử dụng react-beautiful-dnd hoặc dnd-kit
- Sử dụng Tailwind CSS
- Props: todoListId (optional)
```

#### Prompt 2.3: Calendar View Component (Tái sử dụng dữ liệu)
```
Tạo component CalendarView trong src/components/builder/CalendarView.jsx với các tính năng:
- GỌI API: apiService.getAllMyItems() để lấy tasks
- Hiển thị task trên lịch theo field dueDate
- Task không có dueDate không hiển thị trên calendar
- Click task để mở TaskDetailModal
- Drag task sang ngày khác: gọi apiService.updateTodoItem() với dueDate mới
- Click ngày trống để tạo task mới với dueDate đó
- Sử dụng react-big-calendar hoặc FullCalendar
- Màu event theo priority
- Props: todoListId (optional)
```

---

### Giai đoạn 3: Tính năng nâng cao

#### Prompt 3.1: Filter & Sort Bar Component (Dùng dữ liệu có sẵn)
```
Tạo component FilterSortBar trong src/components/builder/FilterSortBar.jsx với các tính năng:
- Filter theo các field có sẵn: Status, Priority, DueDate, TodoListId
- Nút "Add Filter" mở dropdown:
  - Status: dropdown chọn Todo/InProgress/Done
  - Priority: dropdown chọn Low/Medium/High
  - Due Date: before/after/between với date picker
  - List: dropdown chọn từ danh sách TodoLists
- Có thể thêm nhiều filter (AND logic)
- Sort theo: Title (A-Z), DueDate (sớm nhất), Priority (cao nhất), Status
- Filter/Sort được apply ở frontend (filter array tasks)
- Sử dụng Tailwind CSS
- Props: filters, sorts, onFilterChange, onSortChange, todoLists
```

#### Prompt 3.2: Group By Component (Dùng dữ liệu có sẵn)
```
Tạo component GroupBySelector trong src/components/builder/GroupBySelector.jsx với các tính năng:
- Dropdown chọn field để group: None, Status, Priority, TodoList
- Khi chọn Status: nhóm thành 3 group (Todo, InProgress, Done)
- Khi chọn Priority: nhóm thành 3 group (Low, Medium, High)
- Khi chọn TodoList: nhóm theo tên list
- Header mỗi nhóm hiển thị tên + số lượng task
- Collapse/expand từng nhóm
- Sử dụng Tailwind CSS
- Props: groupBy, onGroupByChange
```

#### Prompt 3.3: Task Detail Modal Component (Dùng dữ liệu có sẵn)
```
Tạo component TaskDetailModal trong src/components/builder/TaskDetailModal.jsx với các tính năng:
- Modal hiển thị chi tiết task từ API
- Title lớn ở trên (inline editable)
- Properties:
  - Status: dropdown Todo/InProgress/Done
  - Priority: dropdown Low/Medium/High  
  - Due Date: date picker
  - List: dropdown chọn TodoList
- Mỗi thay đổi gọi apiService.updateTodoItem()
- Nút xóa task: gọi apiService.deleteTodoItem()
- Nút đóng modal
- Sử dụng Tailwind CSS
- Props: taskId, isOpen, onClose, onTaskUpdated, onTaskDeleted
```

---

### Giai đoạn 4: UI/UX hoàn thiện

#### Prompt 4.1: Select/Multi-select Dropdown Component
```
Tạo component SelectDropdown trong src/components/builder/SelectDropdown.jsx với các tính năng:
- Dropdown cho phép chọn 1 giá trị (Select) hoặc nhiều giá trị (Multi-select)
- Mỗi option hiển thị dạng tag có màu
- Input search để tìm option
- Nút "+ Add option" để thêm option mới
- Click option đã tồn tại để chọn màu mới
- Sử dụng Tailwind CSS
- Props: value, options, isMulti, onChange, onOptionsChange
```

#### Prompt 4.2: Date Picker Component
```
Tạo component DatePickerCell trong src/components/builder/DatePickerCell.jsx với các tính năng:
- Click để mở date picker popup
- Chọn ngày đơn lẻ
- Toggle để chọn khoảng ngày (start - end)
- Hiển thị ngày đã chọn dạng "Dec 3, 2025" hoặc "Dec 3 - Dec 10"
- Nút clear để xóa ngày
- Sử dụng react-datepicker hoặc tương tự
- Props: value, onChange, allowRange
```

#### Prompt 4.3: Person/Assignee Picker Component
```
Tạo component PersonPicker trong src/components/builder/PersonPicker.jsx với các tính năng:
- Click để mở dropdown danh sách người dùng
- Hiển thị avatar và tên
- Input search để tìm người
- Cho phép chọn nhiều người (multi-select)
- Hiển thị người đã chọn dạng avatar stack
- Sử dụng Tailwind CSS
- Props: value, users, onChange
```

---

### Giai đoạn 5: Tính năng Notion nâng cao

#### Prompt 5.1: Formula Property
```
Tạo component FormulaEditor trong src/components/builder/FormulaEditor.jsx với các tính năng:
- Input để nhập công thức (ví dụ: prop("Price") * prop("Quantity"))
- Hỗ trợ các hàm cơ bản: sum, avg, min, max, if, concat, now, dateBetween...
- Autocomplete khi gõ tên property
- Preview kết quả công thức
- Validate công thức và hiển thị lỗi
- Sử dụng Tailwind CSS
- Props: formula, properties, onChange
```

#### Prompt 5.2: Relation Property
```
Tạo component RelationPicker trong src/components/builder/RelationPicker.jsx với các tính năng:
- Click để mở dropdown chọn item từ database khác
- Hiển thị danh sách item từ related database
- Input search để tìm item
- Cho phép chọn nhiều item
- Hiển thị item đã chọn dạng link
- Sử dụng Tailwind CSS
- Props: value, relatedDatabase, onChange
```

#### Prompt 5.3: Comment Section
```
Tạo component CommentSection trong src/components/builder/CommentSection.jsx với các tính năng:
- Hiển thị danh sách comment theo thời gian
- Mỗi comment có avatar, tên, thời gian, nội dung
- Input để thêm comment mới
- Nút gửi comment
- Có thể reply comment (nested)
- Sử dụng Tailwind CSS
- Props: comments, currentUser, onAddComment
```

---

## 8. Prompt tích hợp vào App Builder

#### Prompt 8.1: Tích hợp Database vào App Builder
```
Cập nhật AppBuilderPage.jsx để:
- Thêm "Database" vào toolbox items
- Khi kéo Database vào canvas, tạo một database mới với cấu trúc mặc định
- Cho phép chọn view (Table/Board/Calendar/List) trong Properties Panel
- Lưu cấu trúc database (columns, data) vào projectData
- Load lại database khi mở project
```

#### Prompt 8.2: Properties Panel cho Database
```
Cập nhật PropertiesPanel.jsx để:
- Khi chọn Database component, hiển thị các config:
  - Database name
  - Default view
  - Visible properties
  - Filter presets
  - Sort presets
- Cho phép mở Property Editor từ panel
```

---

*Tài liệu này giúp bạn định hướng xây dựng TodoList giống Notion trong App Builder.*
