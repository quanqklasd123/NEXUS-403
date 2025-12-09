# Phân tích Cấu trúc và Cách thức Hoạt động của ComponentTypes trong Canvas Area

**Ngày tạo:** 12/09/2025  
**Phiên bản:** 1.0

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc Canvas Area](#cấu-trúc-canvas-area)
3. [Phân loại Component Types](#phân-loại-component-types)
4. [Cơ chế Render Component](#cơ-chế-render-component)
5. [Luồng xử lý Component](#luồng-xử-lý-component)
6. [Chi tiết từng Component Type](#chi-tiết-từng-component-type)
7. [Tương tác và Events](#tương-tác-và-events)
8. [Dependencies và Relationships](#dependencies-và-relationships)

---

## 🎯 Tổng quan

Canvas Area là vùng làm việc chính trong App Builder, nơi người dùng kéo thả và sắp xếp các components để tạo ứng dụng. Mỗi component được định nghĩa bởi một `type` (componentType) và được render thông qua hệ thống `RenderComponent`.

### Kiến trúc tổng thể:

```
CanvasArea
  └── DraggableComponent (Wrapper)
      └── RenderComponent
          └── [Component Type Specific Render]
```

---

## 🏗️ Cấu trúc Canvas Area

### 1. CanvasArea Component (`CanvasArea.jsx`)

**Vai trò:** Container chính chứa tất cả components

**Cấu trúc:**
```javascript
CanvasArea({
  items: Array<Item>,           // Danh sách tất cả components
  selectedId: string | null,    // ID của component đang được chọn
  onSelectItem: Function,       // Callback khi chọn component
  isPreview: boolean,          // Chế độ preview hay edit
  navigate: Function,           // Navigation function
  searchQuery: string,         // Tìm kiếm components
  filterTag: string,           // Lọc theo tag
  context: Object              // Context data cho data binding
})
```

**Chức năng chính:**

1. **Filter Items:**
   - Lọc theo `searchQuery` (tên, type, tags)
   - Lọc theo `filterTag`
   - Chỉ hiển thị root items (không có `parentId`)

2. **Layout:**
   - Sử dụng **Flow Layout** (flex-col) thay vì absolute positioning
   - Components xếp theo thứ tự `order`
   - Background grid pattern để dễ căn chỉnh

3. **Droppable Area:**
   - Sử dụng `@dnd-kit/core` để nhận components từ Toolbox
   - Visual feedback khi drag over (ring-4 ring-sage-100)

### 2. DraggableComponent Wrapper

**Vai trò:** Wrapper cho mỗi component, xử lý drag & drop

**Cấu trúc:**
```javascript
DraggableComponent({
  item: Item,                  // Component data
  items: Array<Item>,          // Tất cả items (để tìm children)
  isSelected: boolean,         // Component có đang được chọn?
  onClick: Function,            // Click handler
  isPreview: boolean,          // Preview mode?
  navigate: Function,           // Navigation
  context: Object              // Context
})
```

**Chức năng:**

1. **Drag & Drop:**
   - Sử dụng `useDraggable` từ `@dnd-kit/core`
   - Disable drag trong preview mode
   - Transform khi đang drag (opacity: 0.8)

2. **Selection:**
   - Click để chọn component
   - Z-index: 1000 (dragging), 100 (selected), 1 (normal)

3. **Style Wrapper:**
   - Width từ `item.style.width` hoặc '100%'
   - MinHeight từ `item.style.minHeight` hoặc '50px'
   - Transform từ drag operation

---

## 📦 Phân loại Component Types

Các component types được phân thành 4 nhóm chính:

### 1. **Layout Components** (11 types)
Các component dùng để bố cục và chứa components khác:

| Type | Mô tả | Có thể chứa children? | Droppable? |
|------|-------|----------------------|------------|
| `container` | Container linh hoạt | ✅ Có | ✅ Có |
| `row` | Flex row layout | ✅ Có | ✅ Có |
| `grid` | Grid layout với columns | ✅ Có | ✅ Có |
| `divider` | Đường kẻ phân cách | ❌ Không | ❌ Không |
| `tabs` | Tab navigation | ❌ Không | ❌ Không |
| `modal` | Modal/Popup | ❌ Không | ❌ Không |
| `card` | Card container | ❌ Không | ❌ Không |
| `image` | Image placeholder | ❌ Không | ❌ Không |
| `chart` | Chart placeholder | ❌ Không | ❌ Không |
| `statCard` | Statistic card | ❌ Không | ❌ Không |
| `dataTable` | Data table (mock) | ❌ Không | ❌ Không |
| `listView` | List view (mock) | ❌ Không | ❌ Không |

### 2. **Form Components** (9 types)
Các component input và form controls:

| Type | Mô tả | Events hỗ trợ |
|------|-------|---------------|
| `button` | Button | `onClick` |
| `input` | Text input | `onChange`, `onFocus`, `onBlur` |
| `checkbox` | Checkbox | `onChange` |
| `select` | Dropdown select | `onChange` |
| `datePicker` | Date picker | `onChange` |
| `richText` | Rich text editor | `onChange` |
| `fileUpload` | File upload | `onChange` |
| `switch` | Toggle switch | `onChange` |
| `text` | Text block | - |

### 3. **Data Components** (4 types)
Các component hiển thị dữ liệu từ API:

| Type | Mô tả | Data Source | Events |
|------|-------|-------------|--------|
| `taskTable` | Bảng tasks | `apiService.getAllMyItems()` | `view-change`, `filter-change`, `search-change` |
| `taskList` | Danh sách tasks | `apiService.getAllMyItems()` | `view-change`, `filter-change`, `search-change` |
| `taskBoard` | Kanban board | `apiService.getAllMyItems()` | `view-change`, `filter-change`, `search-change` |
| `taskCalendar` | Calendar view | `apiService.getAllMyItems()` | `view-change`, `filter-change`, `search-change` |

### 4. **Control Components** (7 types)
Các component điều khiển và tương tác:

| Type | Mô tả | Chức năng |
|------|-------|-----------|
| `viewSwitcher` | Chuyển đổi view | Dispatch `view-change` event |
| `viewSidebar` | Sidebar chuyển view | Dispatch `view-change` event |
| `filterBar` | Filter bar | Dispatch `filter-change` event |
| `searchBox` | Search box | Dispatch `search-change` event |
| `sortDropdown` | Sort dropdown | Dispatch `sort-change` event |
| `addTaskButton` | Button thêm task | Tạo task mới |
| `databaseTitle` | Database title | Hiển thị tiêu đề |

---

## ⚙️ Cơ chế Render Component

### Luồng Render:

```
1. CanvasArea nhận items
   ↓
2. Filter root items (không có parentId)
   ↓
3. Map qua rootItems → DraggableComponent
   ↓
4. DraggableComponent → RenderComponent
   ↓
5. RenderComponent kiểm tra:
   - Visibility condition
   - Dependencies
   - Conditional style/props
   ↓
6. Switch case theo item.type
   ↓
7. Render component cụ thể
```

### RenderComponent Logic:

#### 1. **Pre-render Checks:**

```javascript
// 1. Check visibility
const shouldShow = item.visibility?.condition 
    ? evaluateCondition(item.visibility.condition, context)
    : (item.visibility?.default !== undefined ? item.visibility.default : true);

if (!shouldShow) return null;

// 2. Check dependencies
const dependenciesValid = checkDependencies(item, items);
if (!dependenciesValid && isPreview) {
    finalProps.disabled = true;
}

// 3. Get conditional style/props
const finalStyle = getConditionalStyle(item, context);
const finalProps = getConditionalProps(item, context);
```

#### 2. **Children Resolution:**

```javascript
// Lấy children của item này (sắp xếp theo order)
const childItems = items
    .filter(child => child.parentId === item.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
```

#### 3. **Droppable Setup:**

```javascript
// Chỉ container, row, grid là droppable
const isDroppableType = !isPreview && 
    (item.type === 'container' || item.type === 'row' || item.type === 'grid');

const droppableResult = useDroppable({ 
    id: item.id,
    disabled: !isDroppableType 
});
```

#### 4. **Content Rendering:**

```javascript
const content = () => {
    switch (item.type) {
        case 'container': // Render container với children
        case 'row': // Render row với children
        case 'grid': // Render grid với children
        case 'taskTable': // Render TaskTableRender
        // ... các cases khác
        default: return null;
    }
};
```

#### 5. **Wrapper Style:**

```javascript
// Phân loại components để áp dụng style khác nhau
const layoutComponents = ['container', 'card', 'row', 'grid', ...];
const formComponents = ['button', 'input', 'select', ...];
const dataComponents = ['taskTable', 'taskList', ...];
const controlComponents = ['viewSwitcher', 'filterBar', ...];

// Áp dụng backgroundColor và padding cho layout/data components
const wrapperStyle = {
    width: finalStyle.width,
    height: finalStyle.height,
    backgroundColor: [...layoutComponents, ...dataComponents].includes(item.type) 
        ? finalStyle.backgroundColor 
        : undefined,
    padding: [...layoutComponents, ...dataComponents].includes(item.type) 
        ? finalStyle.padding 
        : 0,
    // ...
};
```

---

## 🔄 Luồng xử lý Component

### 1. **Tạo Component mới:**

```
User kéo từ Toolbox
  ↓
Toolbox dispatch drag event
  ↓
CanvasArea nhận drop
  ↓
AppBuilderPage tạo item mới:
  {
    id: uuid(),
    type: tool.type,
    props: tool.defaultProps,
    style: tool.defaultStyle,
    parentId: null,
    order: items.length
  }
  ↓
Thêm vào items array
  ↓
Re-render CanvasArea
```

### 2. **Update Component:**

```
User chọn component
  ↓
PropertiesPanel hiển thị
  ↓
User thay đổi props/style
  ↓
onPropsChange callback
  ↓
Update item trong items array
  ↓
Re-render component
```

### 3. **Delete Component:**

```
User click delete
  ↓
Remove item khỏi items array
  ↓
Remove tất cả children (recursive)
  ↓
Re-render CanvasArea
```

### 4. **Move Component:**

```
User drag component
  ↓
@dnd-kit xử lý drag
  ↓
onDragEnd callback
  ↓
Update parentId và order
  ↓
Re-render với vị trí mới
```

---

## 📝 Chi tiết từng Component Type

### Layout Components

#### 1. **Container**
```javascript
case 'container':
  // Có thể chứa children
  // Droppable trong edit mode
  // Hỗ trợ onClick event trong preview
  // Render children nếu có, nếu không hiển thị placeholder
```

**Props:**
- `label`: Text hiển thị khi trống
- `events.onClick`: Event handler

**Style:**
- `width`, `height`, `backgroundColor`, `padding`, `border`

#### 2. **Row (Flex)**
```javascript
case 'row':
  // Flex layout (horizontal)
  // Có thể chứa children
  // Droppable trong edit mode
```

**Props:**
- `label`: Text hiển thị khi trống

**Style:**
- `display: 'flex'`, `gap`, `padding`

#### 3. **Grid (Columns)**
```javascript
case 'grid':
  // Grid layout
  // Có thể chứa children
  // Droppable trong edit mode
```

**Props:**
- `columns`: Số cột (default: '3')
- `label`: Text hiển thị khi trống

**Style:**
- `display: 'grid'`, `gridTemplateColumns`, `gap`

### Form Components

#### 1. **Button**
```javascript
case 'button':
  // Hỗ trợ onClick event
  // Disabled state từ conditional props
```

**Props:**
- `label`: Button text
- `events.onClick`: Event handler
- `disabled`: Disabled state

**Style:**
- `backgroundColor`, `color`, `padding`, `borderRadius`

#### 2. **Input**
```javascript
case 'input':
  // Hỗ trợ onChange, onFocus, onBlur events
  // ReadOnly trong edit mode
```

**Props:**
- `placeholder`: Placeholder text
- `events.onChange`, `events.onFocus`, `events.onBlur`
- `readOnly`, `disabled`

**Style:**
- `width`, `padding`, `border`, `borderRadius`

### Data Components

#### 1. **TaskTable**
```javascript
case 'taskTable':
  return <TaskTableRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `columns`: ['title', 'status', 'priority', 'dueDate']
- `showHeader`: boolean
- `allowEdit`: boolean
- `allowDelete`: boolean
- `todoListId`: number | null

**Events lắng nghe:**
- `view-change`: Chỉ hiển thị khi view === 'table'
- `filter-change`: Apply filters
- `search-change`: Apply search query
- `tasks-updated`: Refresh data

**Data Flow:**
```
Mount → Fetch tasks từ API
  ↓
Listen events (view-change, filter-change, search-change)
  ↓
Apply filters/search
  ↓
Render table với filtered data
```

#### 2. **TaskList**
```javascript
case 'taskList':
  return <TaskListRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `showCheckbox`: boolean
- `showPriority`: boolean
- `showDueDate`: boolean
- `groupByStatus`: boolean
- `todoListId`: number | null

**Events:** Tương tự TaskTable

#### 3. **TaskBoard (Kanban)**
```javascript
case 'taskBoard':
  return <TaskBoardRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `columns`: ['Todo', 'InProgress', 'Done']
- `allowDrag`: boolean
- `showPriority`: boolean
- `showDueDate`: boolean
- `todoListId`: number | null

**Features:**
- Drag & drop giữa các columns
- Update status khi drop

#### 4. **TaskCalendar**
```javascript
case 'taskCalendar':
  return <TaskCalendarRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `viewMode`: 'month' | 'week' | 'day'
- `showPriority`: boolean
- `todoListId`: number | null

**Features:**
- Hiển thị tasks trên calendar theo dueDate
- Navigate tháng/tuần/ngày

### Control Components

#### 1. **ViewSwitcher**
```javascript
case 'viewSwitcher':
  return <ViewSwitcherRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `views`: ['table', 'list', 'board', 'calendar']
- `defaultView`: 'table'

**Chức năng:**
- Dispatch `view-change` event khi click
- Data components listen và hiển thị/ẩn tương ứng

#### 2. **ViewSidebar**
```javascript
case 'viewSidebar':
  return <ViewSidebarRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `views`: ['table', 'list', 'board', 'calendar']
- `defaultView`: 'table'
- `position`: 'left' | 'right'
- `collapsed`: boolean

**Chức năng:**
- Sidebar với tabs để chuyển view
- Có thể collapse/expand
- Fixed position

#### 3. **FilterBar**
```javascript
case 'filterBar':
  return <FilterBarRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `filterFields`: ['status', 'priority', 'dueDate']

**Chức năng:**
- UI để chọn filters
- Dispatch `filter-change` event với filter object
- Data components apply filters

#### 4. **SearchBox**
```javascript
case 'searchBox':
  return <SearchBoxRender 
    props={mergedProps} 
    style={contentStyle} 
    isPreview={isPreview} 
  />;
```

**Props:**
- `placeholder`: 'Search tasks...'

**Chức năng:**
- Input search
- Dispatch `search-change` event với query
- Data components filter theo query

---

## 🎯 Tương tác và Events

### Event System

#### 1. **Window Events (Global):**

```javascript
// View change
window.dispatchEvent(new CustomEvent('view-change', { 
    detail: { view: 'table' } 
}));

// Filter change
window.dispatchEvent(new CustomEvent('filter-change', { 
    detail: { filters: { status: 'Todo' } } 
}));

// Search change
window.dispatchEvent(new CustomEvent('search-change', { 
    detail: { query: 'search text' } 
}));

// Tasks updated
window.dispatchEvent(new CustomEvent('tasks-updated'));
```

#### 2. **Component Events (Local):**

```javascript
// Button onClick
if (isPreview && mergedProps.events?.onClick) {
    buttonProps.onClick = async (e) => {
        e.stopPropagation();
        await handleEvent(mergedProps.events.onClick, navigate);
    };
}
```

**Event Types:**
- `navigate`: Chuyển trang
- `notification`: Hiển thị thông báo
- `api`: Gọi API
- `modal`: Mở modal
- `variable`: Update biến

### Data Binding

```javascript
// Resolve data binding trong props
const label = resolveDataBinding(mergedProps.label, context) 
    || mergedProps.label 
    || 'Default';

// Context có thể chứa:
context = {
    globalVariables: { ... },
    user: { ... },
    // ...
}
```

---

## 🔗 Dependencies và Relationships

### 1. **Parent-Child Relationship:**

```javascript
// Item có parentId → là child
const childItems = items
    .filter(child => child.parentId === item.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
```

**Hierarchy:**
```
Container (parentId: null)
  └── Row (parentId: container.id)
      └── Button (parentId: row.id)
```

### 2. **Dependencies:**

```javascript
// Item có thể depend on items khác
item.relationships = {
    dependsOn: [itemId1, itemId2]
}

// Check dependencies
const checkDependencies = (item, allItems) => {
    if (!item.relationships?.dependsOn) return true;
    
    const dependencies = item.relationships.dependsOn
        .map(id => allItems.find(i => i.id === id))
        .filter(Boolean);
    
    return dependencies.length === item.relationships.dependsOn.length;
};
```

**Use case:**
- Button có thể depend on Input (chỉ enable khi Input có giá trị)
- Data component có thể depend on FilterBar

### 3. **Visibility Conditions:**

```javascript
// Item có thể có visibility condition
item.visibility = {
    condition: {
        type: 'equals',
        left: '{{variable.status}}',
        right: 'active'
    },
    default: true
}

// Evaluate condition
const shouldShow = item.visibility?.condition 
    ? evaluateCondition(item.visibility.condition, context)
    : (item.visibility?.default !== undefined ? item.visibility.default : true);
```

---

## 📊 Tóm tắt

### Component Type Categories:

1. **Layout (11 types):** Bố cục và container
2. **Form (9 types):** Input và form controls
3. **Data (4 types):** Hiển thị dữ liệu từ API
4. **Control (7 types):** Điều khiển và tương tác

### Render Flow:

```
CanvasArea → DraggableComponent → RenderComponent → [Specific Render]
```

### Key Features:

- ✅ Flow layout (không absolute positioning)
- ✅ Drag & drop với @dnd-kit
- ✅ Parent-child relationships
- ✅ Dependencies và visibility conditions
- ✅ Event system (global và local)
- ✅ Data binding với context
- ✅ Conditional styling và props

---

**Cập nhật lần cuối:** 12/09/2025

