# Hướng dẫn Test Phase 3: Tự động tạo Calendar Event

## Mục tiêu Test

Kiểm tra xem hệ thống có tự động tạo, cập nhật, và xóa Google Calendar events khi:
- Tạo task mới có dueDate
- Cập nhật task (thay đổi dueDate, title, etc.)
- Xóa task

---

## Chuẩn bị

### 1. Kiểm tra Backend đang chạy

- Backend server đang chạy ở `http://localhost:5205`
- Database đã được migrate với các bảng Google Calendar

### 2. Kiểm tra Frontend đang chạy

- Frontend đang chạy ở `http://localhost:5173`

### 3. Kết nối Google Calendar

- User đã kết nối Google Calendar trong Settings
- Hoặc đã publish app và user có thể kết nối

---

## Test Cases

### Test Case 1: Tạo Task với DueDate

**Mục tiêu**: Kiểm tra hệ thống tự động tạo calendar event khi tạo task có dueDate

**Các bước**:

1. Mở ứng dụng và đăng nhập
2. Vào trang tạo task (hoặc App Builder với AddTaskButton)
3. Tạo một task mới với:
   - **Title**: "Test Task - Calendar Event"
   - **Category**: Chọn một danh mục
   - **DueDate**: Chọn một ngày và giờ trong tương lai (ví dụ: 2 ngày sau, 14:00)
   - **Status**: Todo
   - **Priority**: Medium
4. Click "Add" hoặc "Tạo task"
5. Kiểm tra:

   ✅ **Trong ứng dụng**:
   - Task được tạo thành công
   - Task hiển thị đúng với dueDate

   ✅ **Trong Google Calendar**:
   - Mở [Google Calendar](https://calendar.google.com)
   - Tìm event với title "Test Task - Calendar Event"
   - Kiểm tra:
     - Start time = dueDate
     - End time = dueDate + 1 hour
     - Description chứa category name
     - Reminders được thiết lập (1 ngày trước và đúng giờ)

   ✅ **Trong Database**:
   - Kiểm tra bảng `TaskCalendarEvents` có record mới
   - `TodoItemId` khớp với task vừa tạo
   - `GoogleEventId` không null

**Kỳ vọng**: Task được tạo, calendar event được tạo tự động trong Google Calendar

---

### Test Case 2: Cập nhật Task (Thay đổi DueDate)

**Mục tiêu**: Kiểm tra hệ thống tự động cập nhật calendar event khi thay đổi dueDate

**Các bước**:

1. Tìm task đã tạo ở Test Case 1
2. Cập nhật task:
   - Thay đổi **DueDate** sang một ngày giờ khác (ví dụ: 3 ngày sau, 16:00)
   - Có thể thay đổi Title
3. Lưu thay đổi
4. Kiểm tra:

   ✅ **Trong Google Calendar**:
   - Mở event đã tạo ở Test Case 1
   - Kiểm tra:
     - Start time = dueDate mới
     - End time = dueDate mới + 1 hour
     - Title đã được cập nhật (nếu có thay đổi)
     - Reminders vẫn còn

**Kỳ vọng**: Calendar event được cập nhật với thông tin mới

---

### Test Case 3: Xóa DueDate khỏi Task

**Mục tiêu**: Kiểm tra hệ thống tự động xóa calendar event khi xóa dueDate

**Các bước**:

1. Tìm task đã tạo ở Test Case 1 hoặc 2
2. Cập nhật task:
   - **Xóa DueDate** (để trống)
3. Lưu thay đổi
4. Kiểm tra:

   ✅ **Trong Google Calendar**:
   - Event đã bị xóa khỏi Google Calendar

   ✅ **Trong Database**:
   - Record trong bảng `TaskCalendarEvents` đã bị xóa

**Kỳ vọng**: Calendar event bị xóa khi task không còn dueDate

---

### Test Case 4: Xóa Task

**Mục tiêu**: Kiểm tra hệ thống tự động xóa calendar event khi xóa task

**Các bước**:

1. Tạo một task mới với dueDate
2. Đợi calendar event được tạo
3. Xóa task
4. Kiểm tra:

   ✅ **Trong Google Calendar**:
   - Event đã bị xóa khỏi Google Calendar

   ✅ **Trong Database**:
   - Record trong bảng `TaskCalendarEvents` đã bị xóa

**Kỳ vọng**: Calendar event bị xóa khi task bị xóa

---

### Test Case 5: Tạo Task KHÔNG có DueDate

**Mục tiêu**: Kiểm tra hệ thống KHÔNG tạo calendar event khi task không có dueDate

**Các bước**:

1. Tạo một task mới KHÔNG có dueDate:
   - **Title**: "Test Task - No DueDate"
   - **Category**: Chọn một danh mục
   - **DueDate**: Để trống
2. Click "Add" hoặc "Tạo task"
3. Kiểm tra:

   ✅ **Trong Google Calendar**:
   - KHÔNG có event mới được tạo

   ✅ **Trong Database**:
   - KHÔNG có record mới trong bảng `TaskCalendarEvents`

**Kỳ vọng**: Không có calendar event được tạo

---

### Test Case 6: Thêm DueDate vào Task không có DueDate

**Mục tiêu**: Kiểm tra hệ thống tự động tạo calendar event khi thêm dueDate vào task hiện tại

**Các bước**:

1. Lấy task từ Test Case 5 (không có dueDate)
2. Cập nhật task:
   - **Thêm DueDate**: Chọn một ngày và giờ
3. Lưu thay đổi
4. Kiểm tra:

   ✅ **Trong Google Calendar**:
   - Event mới được tạo với dueDate vừa thêm

   ✅ **Trong Database**:
   - Có record mới trong bảng `TaskCalendarEvents`

**Kỳ vọng**: Calendar event được tạo khi thêm dueDate

---

## Kiểm tra Database

### SQL Query để kiểm tra TaskCalendarEvents

```sql
-- Xem tất cả calendar events
SELECT 
    tce.Id,
    tce.TodoItemId,
    tce.GoogleEventId,
    tce.CalendarId,
    ti.Title as TaskTitle,
    ti.DueDate,
    tl.Name as CategoryName,
    tce.CreatedAt,
    tce.UpdatedAt
FROM TaskCalendarEvents tce
INNER JOIN TodoItems ti ON tce.TodoItemId = ti.Id
INNER JOIN TodoLists tl ON ti.TodoListId = tl.Id
ORDER BY tce.CreatedAt DESC;

-- Kiểm tra tasks có dueDate nhưng chưa có calendar event
SELECT 
    ti.Id,
    ti.Title,
    ti.DueDate,
    tl.Name as CategoryName,
    u.Email as UserEmail
FROM TodoItems ti
INNER JOIN TodoLists tl ON ti.TodoListId = tl.Id
INNER JOIN AspNetUsers u ON tl.AppUserId = u.Id
LEFT JOIN TaskCalendarEvents tce ON ti.Id = tce.TodoItemId
WHERE ti.DueDate IS NOT NULL
  AND tce.Id IS NULL
ORDER BY ti.DueDate DESC;
```

---

## Kiểm tra Logs

Kiểm tra backend logs để xem các messages:

```
[Information] Created Google Calendar event {EventId} for task {TaskId}
[Information] Updated Google Calendar event {EventId} for task {TaskId}
[Information] Deleted Google Calendar event for task {TaskId}
[Warning] User {UserId} has not connected Google Calendar
[Error] Error creating Google Calendar event for task {TaskId}
```

---

## Checklist Test Phase 3

- [ ] Backend server đang chạy
- [ ] Frontend đang chạy
- [ ] User đã kết nối Google Calendar
- [ ] Test Case 1: Tạo task với dueDate → Event được tạo
- [ ] Test Case 2: Cập nhật task dueDate → Event được cập nhật
- [ ] Test Case 3: Xóa dueDate → Event bị xóa
- [ ] Test Case 4: Xóa task → Event bị xóa
- [ ] Test Case 5: Tạo task không có dueDate → Không có event
- [ ] Test Case 6: Thêm dueDate vào task → Event được tạo
- [ ] Kiểm tra database có records đúng
- [ ] Kiểm tra Google Calendar có events đúng
- [ ] Kiểm tra reminders hoạt động (đợi đến thời gian reminder)

---

## Troubleshooting

### Event không được tạo

1. **Kiểm tra user đã kết nối Google Calendar chưa**:
   - Vào Settings → Kiểm tra trạng thái kết nối

2. **Kiểm tra logs**:
   - Xem backend console có lỗi gì không

3. **Kiểm tra access token**:
   - Token có thể đã hết hạn
   - Thử disconnect và connect lại Google Calendar

4. **Kiểm tra database**:
   - Kiểm tra bảng `GoogleCalendarTokens` có token của user

### Event bị tạo nhưng không hiển thị trong Google Calendar

1. **Kiểm tra GoogleEventId trong database**:
   - Event có thể đã được tạo nhưng có lỗi

2. **Kiểm tra Google Calendar**:
   - Xem trong "All calendars" hoặc filter theo ngày

3. **Kiểm tra timezone**:
   - Event được tạo với UTC timezone

### Reminders không hoạt động

1. **Reminders được thiết lập bởi Google Calendar**:
   - Reminders sẽ được gửi tự động bởi Google
   - Kiểm tra Google Calendar settings để đảm bảo reminders được bật

2. **Thời gian reminder**:
   - Reminder 1: 1 ngày trước (1440 phút)
   - Reminder 2: Đúng giờ (0 phút)

---

**Last Updated**: 2025-01-03







