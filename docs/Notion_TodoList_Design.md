# Lộ trình thiết kế App TodoList giống Notion trong App Builder

## 1. Tổng quan
Mục tiêu: Xây dựng các **components có thể kéo thả** trong App Builder để người dùng **tự lắp ráp** thành một ứng dụng TodoList giống Notion.

### Ý tưởng chính:
- Người dùng mở App Builder
- Kéo thả các components từ Toolbox vào Canvas
- Cấu hình từng component qua Properties Panel
- Lưu project và sử dụng

### Khác biệt với cách làm cũ:
| Cách cũ (SAI) | Cách mới (ĐÚNG) |
|---------------|-----------------|
| Tạo 1 component hoàn chỉnh `NotionDatabase` | Tạo nhiều components nhỏ trong Toolbox |
| Người dùng import và dùng luôn | Người dùng kéo thả, lắp ráp |
| Không linh hoạt | Linh hoạt, tùy biến cao |

---

## 2. Các Components cần thêm vào Toolbox

### 2.1. Data Components (Hiển thị dữ liệu)
| Component | Mô tả | Icon |
|-----------|-------|------|
| `TaskTable` | Bảng hiển thị tasks | FiGrid |
| `TaskList` | Danh sách tasks với checkbox | FiList |
| `TaskBoard` | Kanban board 3 cột | FiColumns |
| `TaskCalendar` | Calendar view | FiCalendar |

### 2.2. Control Components (Điều khiển)
| Component | Mô tả | Icon |
|-----------|-------|------|
| `ViewSwitcher` | Nút chuyển đổi Table/List/Board/Calendar | FiLayout |
| `FilterBar` | Thanh filter theo Status/Priority/Date | FiFilter |
| `SortDropdown` | Dropdown sắp xếp | FiArrowDown |
| `SearchBox` | Ô tìm kiếm | FiSearch |
| `AddTaskButton` | Nút thêm task mới | FiPlus |

### 2.3. UI Components (Giao diện)
| Component | Mô tả | Icon |
|-----------|-------|------|
| `DatabaseTitle` | Tiêu đề database (editable) | FiType |
| `Divider` | Đường kẻ phân cách | FiMinus |
| `Spacer` | Khoảng trống | FiSquare |

---

## 3. Cấu trúc dữ liệu component trong Toolbox

```javascript
// toolboxItems.js
export const NOTION_COMPONENTS = [
    {
        type: 'TaskTable',
        label: 'Task Table',
        icon: 'FiGrid',
        category: 'Data',
        defaultProps: {
            columns: ['title', 'status', 'priority', 'dueDate'],
            showHeader: true,
            allowEdit: true,
            allowDelete: true,
            todoListId: null, // null = tất cả tasks
        }
    },
    {
        type: 'TaskList',
        label: 'Task List',
        icon: 'FiList',
        category: 'Data',
        defaultProps: {
            showCheckbox: true,
            showPriority: true,
            showDueDate: true,
            groupByStatus: false,
        }
    },
    {
        type: 'TaskBoard',
        label: 'Kanban Board',
        icon: 'FiColumns',
        category: 'Data',
        defaultProps: {
            columns: ['Todo', 'InProgress', 'Done'],
            allowDrag: true,
            showPriority: true,
        }
    },
    // ... các components khác
];
```

---

## 4. Lộ trình phát triển

### Giai đoạn 1: Cập nhật Toolbox
**Prompt 1.1:** Cập nhật `toolboxItems.js`
```
Cập nhật file src/constants/toolboxItems.js:
- Thêm category mới "Notion" hoặc "Data"
- Thêm các components: TaskTable, TaskList, TaskBoard, TaskCalendar
- Thêm các control components: ViewSwitcher, FilterBar, SearchBox, AddTaskButton
- Mỗi component có: type, label, icon, category, defaultProps
```

### Giai đoạn 2: Tạo Render Components
**Prompt 2.1:** Tạo `TaskTableRender.jsx`
```
Tạo component src/components/builder/renders/TaskTableRender.jsx:
- Nhận props từ component config
- Gọi API apiService.getAllMyItems() để lấy dữ liệu
- Hiển thị dạng bảng với các cột được cấu hình
- Hỗ trợ inline editing nếu allowEdit=true
- Hỗ trợ xóa nếu allowDelete=true
- Filter theo todoListId nếu có
```

**Prompt 2.2:** Tạo `TaskListRender.jsx`
```
Tạo component src/components/builder/renders/TaskListRender.jsx:
- Nhận props từ component config
- Hiển thị task dạng danh sách với checkbox
- Toggle status khi click checkbox
- Group theo status nếu groupByStatus=true
```

**Prompt 2.3:** Tạo `TaskBoardRender.jsx`
```
Tạo component src/components/builder/renders/TaskBoardRender.jsx:
- Nhận props từ component config
- Hiển thị Kanban board với các cột
- Drag & drop để thay đổi status
- Sử dụng @hello-pangea/dnd
```

**Prompt 2.4:** Tạo `TaskCalendarRender.jsx`
```
Tạo component src/components/builder/renders/TaskCalendarRender.jsx:
- Nhận props từ component config
- Hiển thị tasks trên calendar theo dueDate
- Sử dụng react-big-calendar
```

### Giai đoạn 3: Cập nhật RenderComponent
**Prompt 3.1:** Cập nhật `RenderComponent.jsx`
```
Cập nhật src/components/builder/RenderComponent.jsx:
- Import các render components mới
- Thêm case cho mỗi component type:
  - case 'TaskTable': return <TaskTableRender {...props} />
  - case 'TaskList': return <TaskListRender {...props} />
  - case 'TaskBoard': return <TaskBoardRender {...props} />
  - case 'TaskCalendar': return <TaskCalendarRender {...props} />
```

### Giai đoạn 4: Cập nhật Properties Panel
**Prompt 4.1:** Cập nhật `PropertiesPanel.jsx`
```
Cập nhật src/components/builder/PropertiesPanel.jsx:
- Thêm config UI cho từng component type:
  - TaskTable: columns, showHeader, allowEdit, allowDelete, todoListId
  - TaskList: showCheckbox, showPriority, groupByStatus
  - TaskBoard: columns, allowDrag
  - TaskCalendar: viewMode (month/week/day)
- Mỗi thay đổi gọi onPropsChange để cập nhật component
```

### Giai đoạn 5: Control Components
**Prompt 5.1:** Tạo control components
```
Tạo các control components:
- ViewSwitcherRender.jsx: Nút chuyển view, emit event để các Data components listen
- FilterBarRender.jsx: Filter UI, emit filter state
- SearchBoxRender.jsx: Input search, emit search query
- AddTaskButtonRender.jsx: Button tạo task mới
```

### Giai đoạn 6: Event System
**Prompt 6.1:** Tạo Event Bus
```
Tạo src/utils/eventBus.js:
- Cho phép các components giao tiếp với nhau
- ViewSwitcher emit 'viewChange' event
- Data components listen và re-render
- FilterBar emit 'filterChange' event
- Data components filter dữ liệu
```

---

## 5. Ví dụ sử dụng trong App Builder

### Người dùng tạo app TodoList:

1. **Mở App Builder** → Tạo project mới "My Todo App"

2. **Kéo thả components:**
   - Kéo `DatabaseTitle` → đặt trên cùng
   - Kéo `ViewSwitcher` → đặt dưới title
   - Kéo `SearchBox` + `FilterBar` → đặt cạnh nhau
   - Kéo `TaskTable` → đặt ở giữa (chiếm phần lớn)

3. **Cấu hình qua Properties Panel:**
   - Click `TaskTable` → chọn columns hiển thị
   - Click `FilterBar` → chọn fields để filter
   - Click `ViewSwitcher` → chọn views có sẵn

4. **Lưu project** → App sẵn sàng sử dụng

---

## 6. Tái sử dụng dữ liệu có sẵn

### API Endpoints đã có:
```javascript
apiService.getAllMyItems()          // Lấy tất cả tasks
apiService.getTodoListById(id)      // Lấy tasks theo list
apiService.createTodoItem(data)     // Tạo task
apiService.updateTodoItem(id, data) // Cập nhật task
apiService.updateItemStatus(id, status) // Cập nhật status
apiService.deleteTodoItem(id)       // Xóa task
```

### Model TodoItem:
```javascript
{
    id: number,
    title: string,
    status: 'Todo' | 'InProgress' | 'Done',
    priority: 'Low' | 'Medium' | 'High',
    dueDate: string | null,
    todoListId: number
}
```

---

## 7. Tổng kết

Với hướng đi mới, App Builder sẽ:
- ✅ Linh hoạt - người dùng tự lắp ráp
- ✅ Tái sử dụng - components dùng lại nhiều nơi
- ✅ Mở rộng - dễ thêm components mới
- ✅ Giống Notion - drag & drop, cấu hình UI

---

*Tài liệu này là hướng dẫn xây dựng TodoList giống Notion trong App Builder theo hướng đúng.*
