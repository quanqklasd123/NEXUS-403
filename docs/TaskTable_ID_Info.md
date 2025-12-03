# 📋 TaskTable Component - ID & Type Info

## Component Type

**Type:** `taskTable`

Đây là identifier được dùng trong code để nhận diện TaskTable component.

---

## Component ID

**Format:** `comp-{timestamp}-{index}`

Ví dụ: `comp-1733222400000-0`

- ID được **tự động tạo** khi bạn kéo thả TaskTable vào Canvas
- Mỗi instance TaskTable sẽ có **ID khác nhau**
- ID này là **duy nhất** cho mỗi component

---

## Cách xem ID

### 1. Trong Properties Panel

1. Click vào TaskTable trên Canvas
2. Properties Panel sẽ mở bên phải
3. Ở header panel, bạn sẽ thấy: **ID: {4 ký tự cuối}**
   - Ví dụ: `ID: 7890`
   - Đây là 4 ký tự cuối của ID đầy đủ

### 2. Trong Console (Developer Tools)

```javascript
// Mở Console (F12) trong App Builder
// Chạy lệnh sau để xem tất cả components:

// Lấy project data (cần access vào React component)
// Hoặc kiểm tra trong Network tab khi save project
```

---

## Sử dụng ID

### 1. Trong Properties Panel của Control Components

Khi cấu hình **ViewSwitcher**, **FilterBar**, **SearchBox**, **SortDropdown**:

1. Click vào component control
2. Properties Panel → "Target Component ID"
3. Dropdown sẽ hiển thị tất cả Data components (TaskTable, TaskList, etc.)
4. Chọn TaskTable bạn muốn điều khiển

### 2. Trong Code

```javascript
// Kiểm tra type
if (item.type === 'taskTable') {
    // Đây là TaskTable component
}

// Tìm TaskTable trong array
const taskTables = canvasItems.filter(item => item.type === 'taskTable');

// Lấy TaskTable đầu tiên
const firstTaskTable = canvasItems.find(item => item.type === 'taskTable');
```

---

## Lưu ý

- ✅ **Type** (`taskTable`) là cố định và không đổi
- ✅ **ID** (`comp-xxx`) là tự động và thay đổi mỗi lần tạo component mới
- ✅ Để liên kết Control components với TaskTable, dùng **ID** (không phải type)
- ✅ Properties Panel có dropdown để chọn ID dễ dàng

---

## Ví dụ thực tế

Giả sử bạn có:
- TaskTable với ID: `comp-1733222400000-0`
- ViewSwitcher với ID: `comp-1733222400001-0`

Để ViewSwitcher điều khiển TaskTable:
1. Click ViewSwitcher
2. Properties Panel → Target Component ID
3. Chọn `comp-1733222400000-0` (TaskTable)
4. Lưu

---

## Tóm tắt

| Thuộc tính | Giá trị | Mô tả |
|-----------|---------|-------|
| **Type** | `taskTable` | Identifier trong code |
| **ID Format** | `comp-{timestamp}-{index}` | ID tự động khi tạo |
| **Xem ID** | Properties Panel hoặc Console | Click component → Properties Panel |
| **Dùng ID** | Link Control components | Target Component ID dropdown |

---

*File này giải thích về ID và Type của TaskTable component trong App Builder.*


