# Phase 3 Test Checklist - Tự động tạo Calendar Event

## 📋 Checklist Test

### ✅ Chuẩn bị
- [ ] Backend server chạy tại `http://localhost:5205`
- [ ] Frontend chạy tại `http://localhost:5173`
- [ ] User đã đăng nhập
- [ ] User đã kết nối Google Calendar (Settings → Kết nối Google Calendar)

---

### Test 1: Tạo Task với DueDate → Event được tạo

**Bước thực hiện**:
1. [ ] Vào App Builder hoặc trang có AddTaskButton
2. [ ] Tạo task mới:
   - Title: "Test Phase 3 - Calendar Event"
   - Category: [Chọn danh mục]
   - DueDate: [Ngày mai, 15:00]
   - Status: Todo
   - Priority: Medium
3. [ ] Click "Add" hoặc "Tạo task"
4. [ ] **Kiểm tra**:
   - [ ] Task xuất hiện trong danh sách
   - [ ] Mở [Google Calendar](https://calendar.google.com)
   - [ ] Tìm event "Test Phase 3 - Calendar Event"
   - [ ] Event có start time = dueDate
   - [ ] Event có end time = dueDate + 1 giờ
   - [ ] Event có description chứa category name
   - [ ] Event có reminders (1 ngày trước + đúng giờ)

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 2: Cập nhật Task → Event được cập nhật

**Bước thực hiện**:
1. [ ] Tìm task "Test Phase 3 - Calendar Event" vừa tạo
2. [ ] Cập nhật:
   - DueDate: [Đổi sang 2 ngày sau, 18:00]
   - Title: [Có thể đổi tên]
3. [ ] Lưu thay đổi
4. [ ] **Kiểm tra**:
   - [ ] Mở Google Calendar
   - [ ] Event có start time mới
   - [ ] Title đã được cập nhật (nếu có đổi)

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 3: Xóa DueDate → Event bị xóa

**Bước thực hiện**:
1. [ ] Tìm task "Test Phase 3 - Calendar Event"
2. [ ] Cập nhật task:
   - Xóa DueDate (để trống)
3. [ ] Lưu thay đổi
4. [ ] **Kiểm tra**:
   - [ ] Event bị xóa khỏi Google Calendar

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 4: Xóa Task → Event bị xóa

**Bước thực hiện**:
1. [ ] Tạo task mới khác với dueDate
2. [ ] Xác nhận event được tạo trong Google Calendar
3. [ ] Xóa task
4. [ ] **Kiểm tra**:
   - [ ] Event bị xóa khỏi Google Calendar

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 5: Tạo Task KHÔNG có DueDate → Không có Event

**Bước thực hiện**:
1. [ ] Tạo task mới KHÔNG có dueDate:
   - Title: "Test - No DueDate"
   - Category: [Chọn danh mục]
   - DueDate: [Để trống]
2. [ ] Click "Add"
3. [ ] **Kiểm tra**:
   - [ ] KHÔNG có event mới trong Google Calendar

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 6: Kiểm tra Database

**SQL Query**:
```sql
SELECT 
    tce.Id,
    tce.TodoItemId,
    tce.GoogleEventId,
    ti.Title as TaskTitle,
    ti.DueDate,
    tl.Name as CategoryName
FROM TaskCalendarEvents tce
INNER JOIN TodoItems ti ON tce.TodoItemId = ti.Id
INNER JOIN TodoLists tl ON ti.TodoListId = tl.Id
ORDER BY tce.CreatedAt DESC;
```

**Kiểm tra**:
- [ ] Có records trong bảng `TaskCalendarEvents`
- [ ] `GoogleEventId` không null
- [ ] `TodoItemId` khớp với task
- [ ] `DueDate` khớp với task

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

### Test 7: Kiểm tra Backend Logs

**Kiểm tra console backend**:
- [ ] Log: "Created Google Calendar event {EventId} for task {TaskId}"
- [ ] Log: "Updated Google Calendar event {EventId} for task {TaskId}"
- [ ] Log: "Deleted Google Calendar event for task {TaskId}"
- [ ] KHÔNG có error logs

**Kết quả**: ✅ PASS / ❌ FAIL
**Ghi chú**:

---

## 📊 Tổng kết Test

- **Tổng số test cases**: 7
- **Số test PASS**: ___ / 7
- **Số test FAIL**: ___ / 7

**Kết quả tổng thể**: ✅ PASS / ❌ FAIL

**Ghi chú tổng hợp**:
```
[Ghi lại các lỗi hoặc vấn đề gặp phải]
```

---

**Ngày test**: ___________
**Người test**: ___________




