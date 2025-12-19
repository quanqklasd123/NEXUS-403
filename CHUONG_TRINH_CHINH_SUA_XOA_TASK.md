# Chức năng Chỉnh sửa và Xóa Task trong App Runtime

## Tổng quan
Đã thêm chức năng chỉnh sửa (edit) và xóa (delete) task trực tiếp trong App Runtime cho các component hiển thị task.

## Các Component được cập nhật

### 1. TaskTableRender (Bảng Task)
- ✅ **Chỉnh sửa inline**: Click vào nút edit (✏️) để chỉnh sửa task trực tiếp trong bảng
- ✅ **Xóa task**: Click vào nút delete (🗑️) để xóa task (có confirm)
- ✅ **Lưu/Hủy**: Sau khi edit, click ✓ để lưu hoặc ✗ để hủy
- ✅ **Các trường có thể edit**:
  - Title (text input)
  - Status (dropdown: Todo, InProgress, Done)
  - Priority (dropdown: Low, Medium, High)
  - Due Date (date picker)

**Cách sử dụng:**
1. Trong App Builder, thêm component "Task Table"
2. Trong Properties Panel, bật/tắt các tùy chọn:
   - ☑️ "Cho phép chỉnh sửa" (allowEdit)
   - ☑️ "Cho phép xóa" (allowDelete)

### 2. TaskListRender (Danh sách Task)
- ✅ **Xóa task**: Nút delete xuất hiện khi hover vào task
- ✅ **Toggle status**: Click checkbox để đánh dấu hoàn thành/chưa hoàn thành

**Cách sử dụng:**
1. Trong App Builder, thêm component "Task List"
2. Trong Properties Panel, bật/tắt:
   - ☑️ "Cho phép chỉnh sửa" (allowEdit) 
   - ☑️ "Cho phép xóa" (allowDelete)

### 3. TaskBoardRender (Kanban Board)
- ✅ **Xóa task**: Nút delete xuất hiện khi hover vào task card
- ✅ **Drag & Drop**: Kéo thả task để thay đổi status (nếu allowDrag = true)

**Cách sử dụng:**
1. Trong App Builder, thêm component "Task Board"
2. Trong Properties Panel, bật/tắt:
   - ☑️ "Cho phép kéo thả" (allowDrag)
   - ☑️ "Cho phép chỉnh sửa" (allowEdit)
   - ☑️ "Cho phép xóa" (allowDelete)

## Tính năng kỹ thuật

### Backend API đã có sẵn:
- `PUT /api/TodoItems/{id}` - Cập nhật task
- `DELETE /api/TodoItems/{id}` - Xóa task
- `PATCH /api/TodoItems/{id}/status` - Cập nhật status nhanh

### Frontend Updates:
1. **apiService.js**: Đã có `updateTodoItem()` và `deleteTodoItem()`
2. **useTaskData hook**: Cập nhật `updateTask()` để convert dữ liệu đúng format
3. **TaskTableRender**: Thêm UI edit inline với validation
4. **TaskListRender**: Thêm nút delete với hover effect
5. **TaskBoardRender**: Thêm nút delete trong card
6. **PropertiesPanel**: Thêm checkbox settings cho allowEdit/allowDelete

## Data Conversion
Backend sử dụng enum số (0, 1, 2), Frontend hiển thị string:
- **Status**: `Todo (0)`, `InProgress (1)`, `Done (2)`
- **Priority**: `Low (0)`, `Medium (1)`, `High (2)`

Code tự động convert qua lại khi gửi/nhận API.

## Testing

### Test Edit trong TaskTable:
1. Mở app runtime: http://localhost:5173/app/{projectId}/69455be5e10747504732b017
2. Click nút Edit (✏️) trên task
3. Thay đổi Title, Status, Priority, hoặc Due Date
4. Click ✓ để lưu
5. Xác nhận task được update

### Test Delete:
1. Click nút Delete (🗑️) 
2. Xác nhận dialog
3. Task biến mất khỏi danh sách

### Test trong các view khác:
- Switch giữa Table/List/Board view
- Verify edit/delete hoạt động đúng trong mỗi view
- Test với filter và search đang active

## Lưu ý quan trọng

### Preview Mode:
- Trong App Builder preview mode, edit/delete KHÔNG gọi API (chỉ update local state)
- Chỉ App Runtime mới thực sự update database

### Security:
- Backend verify ownership qua TodoList
- Chỉ owner của task mới có thể edit/delete
- AppId được validate để đảm bảo security

### Error Handling:
- Hiển thị alert khi delete/update thất bại
- Auto refresh data sau khi thành công
- Revert changes nếu API call thất bại

## Các file đã thay đổi

```
TodoApi/Controllers/TodoItemsController.cs (đã có sẵn API)
todo-frontend/src/services/apiService.js (đã có sẵn)
todo-frontend/src/hooks/useTaskData.js (updated)
todo-frontend/src/components/builder/renders/TaskTableRender.jsx (updated)
todo-frontend/src/components/builder/renders/TaskListRender.jsx (updated)
todo-frontend/src/components/builder/renders/TaskBoardRender.jsx (updated)
todo-frontend/src/components/builder/PropertiesPanel.jsx (updated)
```

## Kết quả
✅ User có thể chỉnh sửa task trực tiếp trong App Runtime
✅ User có thể xóa task với confirmation
✅ Tất cả thay đổi được lưu vào database
✅ UI responsive và user-friendly
✅ Settings có thể tùy chỉnh trong App Builder

---
**Ngày cập nhật**: 20/12/2025
