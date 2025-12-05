# Phase 3 Quick Test Guide - Tự động tạo Calendar Event

## Checklist Test Nhanh

### ✅ Bước 1: Chuẩn bị
- [ ] Backend server đang chạy tại `http://localhost:5205`
- [ ] Frontend đang chạy tại `http://localhost:5173`
- [ ] User đã đăng nhập vào ứng dụng
- [ ] User đã kết nối Google Calendar (Settings → Kết nối Google Calendar)

### ✅ Bước 2: Test Tạo Task với DueDate

**Mục tiêu**: Tạo một task có dueDate và kiểm tra xem event có được tạo trong Google Calendar không.

**Các bước**:
1. Vào App Builder hoặc trang có AddTaskButton
2. Tạo task mới:
   - **Title**: "Test Calendar - Phase 3"
   - **Category**: Chọn bất kỳ danh mục nào
   - **DueDate**: Chọn ngày mai, 15:00 (hoặc bất kỳ giờ nào trong tương lai)
   - **Status**: Todo
   - **Priority**: Medium
3. Click "Add" hoặc "Tạo task"
4. **Kiểm tra ngay**:
   - ✅ Task xuất hiện trong danh sách
   - ✅ Mở [Google Calendar](https://calendar.google.com)
   - ✅ Tìm event "Test Calendar - Phase 3"
   - ✅ Event có start time đúng với dueDate
   - ✅ Event có end time = dueDate + 1 giờ

**Kết quả mong đợi**: ✅ Event được tạo tự động trong Google Calendar

---

### ✅ Bước 3: Test Cập nhật Task

**Mục tiêu**: Cập nhật dueDate và kiểm tra event được cập nhật.

**Các bước**:
1. Tìm task "Test Calendar - Phase 3" vừa tạo
2. Cập nhật:
   - **DueDate**: Đổi sang 2 ngày sau, 18:00
3. Lưu thay đổi
4. **Kiểm tra**:
   - ✅ Mở Google Calendar
   - ✅ Event "Test Calendar - Phase 3" có start time mới

**Kết quả mong đợi**: ✅ Event được cập nhật với thời gian mới

---

### ✅ Bước 4: Test Xóa Task

**Mục tiêu**: Xóa task và kiểm tra event bị xóa.

**Các bước**:
1. Tạo một task mới khác với dueDate (để test xóa)
2. Xác nhận event được tạo trong Google Calendar
3. Xóa task
4. **Kiểm tra**:
   - ✅ Event bị xóa khỏi Google Calendar

**Kết quả mong đợi**: ✅ Event bị xóa khi task bị xóa

---

### ✅ Bước 5: Kiểm tra Database

**Mục tiêu**: Xác nhận records được lưu đúng trong database.

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

**Kết quả mong đợi**: 
- ✅ Có records trong bảng `TaskCalendarEvents`
- ✅ `GoogleEventId` không null
- ✅ `TodoItemId` khớp với task

---

### ✅ Bước 6: Kiểm tra Reminders

**Mục tiêu**: Kiểm tra reminders được thiết lập đúng.

**Các bước**:
1. Mở event trong Google Calendar
2. Click vào event để xem chi tiết
3. Kiểm tra phần "Notifications" hoặc "Reminders"

**Kết quả mong đợi**: 
- ✅ Có 2 reminders:
  - Reminder 1: 1 ngày trước (email + popup)
  - Reminder 2: Đúng giờ (email + popup)

---

## Troubleshooting

### ❌ Event không được tạo

**Nguyên nhân có thể**:
1. User chưa kết nối Google Calendar
   - **Giải pháp**: Vào Settings → Kết nối Google Calendar

2. Access token hết hạn
   - **Giải pháp**: Disconnect và connect lại Google Calendar

3. Backend logs có lỗi
   - **Kiểm tra**: Xem console backend có error gì không

### ❌ Event được tạo nhưng không hiển thị

**Nguyên nhân có thể**:
1. Timezone khác nhau
   - **Giải pháp**: Event được tạo với UTC, kiểm tra trong calendar settings

2. Event trong calendar khác
   - **Giải pháp**: Xem "All calendars" trong Google Calendar

---

## Kết quả Test

Ghi lại kết quả test:

- [ ] Test 1: Tạo task → Event được tạo ✅/❌
- [ ] Test 2: Cập nhật task → Event được cập nhật ✅/❌
- [ ] Test 3: Xóa task → Event bị xóa ✅/❌
- [ ] Test 4: Database có records đúng ✅/❌
- [ ] Test 5: Reminders được thiết lập ✅/❌

**Ghi chú lỗi** (nếu có):
```
[Ghi lại lỗi ở đây]
```

---

**Last Updated**: 2025-01-03




