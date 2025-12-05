# 🔧 Fix lỗi không thể Add Task

## ❌ Vấn đề

Khi click "Add Task" trong AddTaskButton component, gặp lỗi:
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Failed to create task: AxiosError
```

## 🔍 Nguyên nhân

**API Backend yêu cầu format khác với format đang gửi:**

### API yêu cầu (Backend):
```javascript
{
    title: string,
    status: int,        // 0, 1, 2 (không phải string)
    priority: int,      // 0-5 (không phải string)
    todoListId: long    // Bắt buộc, phải là số
}
```

### Code đang gửi (Frontend):
```javascript
{
    title: "Task title",
    status: "Todo",     // ❌ String - SAI
    priority: "Medium", // ❌ String - SAI
    todoListId: 1       // Có thể null hoặc không tồn tại
}
```

## ✅ Đã fix

### 1. Convert Status (String → Int)
```javascript
'Todo' → 0
'InProgress' → 1
'Done' → 2
```

### 2. Convert Priority (String → Int)
```javascript
'Low' → 0
'Medium' → 1
'High' → 2
```

### 3. Lấy TodoListId tự động
- Nếu có `todoListId` trong props → dùng nó
- Nếu không → lấy list đầu tiên từ API
- Fallback: 1

### 4. Fix cảnh báo "transparent"
- Thay `backgroundColor: 'transparent'` → `backgroundColor: undefined`
- React không thích giá trị "transparent" (không phải hex color)

## 📝 File đã sửa

1. ✅ `ControlRenders.jsx` - AddTaskButtonRender:
   - Thêm hàm `convertStatusToInt()`
   - Thêm hàm `convertPriorityToInt()`
   - Thêm hàm `getTodoListId()` để lấy list ID
   - Cải thiện error handling

2. ✅ `RenderComponent.jsx`:
   - Sửa `backgroundColor: 'transparent'` → `undefined`

## 🧪 Test lại

1. Mở App Builder
2. Thêm AddTaskButton vào Canvas
3. Click "Add Task"
4. Nhập title và nhấn Enter
5. ✅ Task sẽ được tạo thành công

## 📋 Mapping Reference

### Status Mapping
| String | Int | Mô tả |
|--------|-----|-------|
| Todo | 0 | Chưa làm |
| InProgress | 1 | Đang làm |
| Done | 2 | Hoàn thành |

### Priority Mapping
| String | Int | Mô tả |
|--------|-----|-------|
| Low | 0 | Thấp |
| Medium | 1 | Trung bình |
| High | 2 | Cao |

---

*Fix này đảm bảo data format đúng với API Backend yêu cầu.*

