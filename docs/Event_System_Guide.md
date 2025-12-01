# Hướng dẫn sử dụng Hệ thống Sự kiện (Event System) - App Builder

**Ngày tạo:** 11/27/2025  
**Phiên bản:** 1.0

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Các component hỗ trợ Events](#các-component-hỗ-trợ-events)
3. [Các loại Actions](#các-loại-actions)
4. [Hướng dẫn từng bước](#hướng-dẫn-từng-bước)
5. [Ví dụ thực tế](#ví-dụ-thực-tế)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

Hệ thống Sự kiện (Event System) cho phép bạn thêm logic tương tác vào các component trong App Builder. Khi người dùng tương tác với component (click, thay đổi giá trị...), các hành động đã được cấu hình sẽ được thực thi.

**Lưu ý quan trọng:** Events chỉ hoạt động trong **Preview Mode**. Trong chế độ Edit, các component chỉ để chỉnh sửa, không thực thi events.

---

## 🧩 Các component hỗ trợ Events

### Component có thể có Events:

| Component | Event Types | Mô tả |
|-----------|------------|-------|
| **Button** | `onClick` | Khi người dùng click vào button |
| **Card** | `onClick` | Khi người dùng click vào card |
| **Container** | `onClick` | Khi người dùng click vào container |
| **Input** | `onChange`, `onFocus`, `onBlur` | Khi người dùng thay đổi, focus, hoặc blur input |
| **Select** | `onChange` | Khi người dùng chọn option mới |
| **DatePicker** | `onChange` | Khi người dùng chọn ngày |
| **Checkbox** | `onChange` | Khi người dùng toggle checkbox |
| **Switch** | `onChange` | Khi người dùng toggle switch |
| **FileUpload** | `onChange` | Khi người dùng chọn file |

---

## ⚡ Các loại Actions

### 1. Navigate to Page
**Mô tả:** Chuyển hướng người dùng đến một trang/route khác trong ứng dụng.

**Config:**
- `route` (string, bắt buộc): Đường dẫn route, ví dụ: `/dashboard`, `/tasks`, `/marketplace`

**Ví dụ:**
```json
{
  "type": "navigate",
  "config": {
    "route": "/dashboard"
  }
}
```

**Sử dụng khi:**
- Button "Go to Dashboard" → Navigate to `/dashboard`
- Card clickable → Navigate to `/tasks/123`
- Navigation menu items

---

### 2. Show Notification
**Mô tả:** Hiển thị thông báo cho người dùng (hiện tại dùng alert, có thể nâng cấp thành toast sau).

**Config:**
- `message` (string, bắt buộc): Nội dung thông báo

**Ví dụ:**
```json
{
  "type": "notification",
  "config": {
    "message": "Đã lưu thành công!"
  }
}
```

**Sử dụng khi:**
- Button "Save" → Show notification "Đã lưu!"
- Form submit → Show notification "Gửi thành công"
- Xác nhận hành động

---

### 3. Call API
**Mô tả:** Gọi một API endpoint từ backend.

**Config:**
- `endpoint` (string, bắt buộc): Đường dẫn API, ví dụ: `/todoitems`, `/projects`
- `method` (string, optional): HTTP method - `GET`, `POST`, `PUT`, `DELETE` (mặc định: `GET`)
- `params` (object, optional): Dữ liệu gửi kèm (cho POST/PUT)
- `showResult` (boolean, optional): Có hiển thị kết quả API không (mặc định: false)

**Ví dụ GET:**
```json
{
  "type": "api",
  "config": {
    "endpoint": "/dashboard/stats",
    "method": "GET",
    "showResult": true
  }
}
```

**Ví dụ POST:**
```json
{
  "type": "api",
  "config": {
    "endpoint": "/todoitems",
    "method": "POST",
    "params": {
      "title": "New Task",
      "todoListId": 1
    },
    "showResult": true
  }
}
```

**Lưu ý:**
- API sẽ tự động gắn token authentication từ localStorage
- Endpoint phải là relative path (không cần `/api` prefix, đã được xử lý)
- Params phải là JSON hợp lệ

**Sử dụng khi:**
- Button "Load Data" → Call API GET để lấy dữ liệu
- Form submit → Call API POST để tạo mới
- Button "Delete" → Call API DELETE để xóa

---

### 4. Open Modal
**Mô tả:** Mở một modal/popup (hiện tại chỉ hiển thị alert, có thể nâng cấp sau).

**Config:**
- `title` (string, optional): Tiêu đề modal
- `content` (string, optional): Nội dung modal

**Ví dụ:**
```json
{
  "type": "modal",
  "config": {
    "title": "Xác nhận",
    "content": "Bạn có chắc chắn muốn xóa?"
  }
}
```

**Lưu ý:** Hiện tại action này sẽ hiển thị alert. Có thể nâng cấp để hiển thị modal thật sau.

**Sử dụng khi:**
- Button "Delete" → Open modal xác nhận
- Button "Info" → Open modal thông tin
- Xác nhận hành động quan trọng

---

### 5. Update Variable
**Mô tả:** Cập nhật giá trị của một biến toàn cục (hiện tại chưa có Global Variables Manager, sẽ được triển khai sau).

**Config:**
- `variableName` (string, bắt buộc): Tên biến cần cập nhật
- `value` (any, bắt buộc): Giá trị mới

**Ví dụ:**
```json
{
  "type": "variable",
  "config": {
    "variableName": "userName",
    "value": "John Doe"
  }
}
```

**Lưu ý:** Tính năng này cần Global Variables Manager để hoạt động đầy đủ.

**Sử dụng khi:**
- Cập nhật state toàn cục
- Lưu giá trị từ form vào biến
- Quản lý state giữa các component

---

## 📝 Hướng dẫn từng bước

### Bước 1: Tạo Component
1. Kéo một component có hỗ trợ events vào Canvas (ví dụ: Button)
2. Component sẽ xuất hiện trên Canvas

### Bước 2: Mở Properties Panel
1. Click vào component vừa tạo để chọn nó
2. Properties Panel sẽ hiển thị ở bên phải

### Bước 3: Chuyển sang tab Events
1. Trong Properties Panel, bạn sẽ thấy 2 tabs: **Properties** và **Events**
2. Click vào tab **Events**

### Bước 4: Thêm Event
1. Tìm Event Type bạn muốn (ví dụ: `onClick` cho Button)
2. Click nút **+** (màu xanh) để thêm event
3. Event sẽ xuất hiện với form cấu hình

### Bước 5: Cấu hình Action
1. Chọn **Action Type** từ dropdown:
   - Navigate to Page
   - Show Notification
   - Call API
   - Open Modal
   - Update Variable

2. Điền **Action Config** tương ứng:
   - **Navigate**: Nhập route (ví dụ: `/dashboard`)
   - **Notification**: Nhập message
   - **API**: Nhập endpoint, chọn method, nhập params (JSON)
   - **Modal**: Nhập title và content
   - **Variable**: Nhập variableName và value

### Bước 6: Lưu và Test
1. Click **Save** để lưu project
2. Click **Preview** để vào Preview Mode
3. Tương tác với component để test event
4. Click **Exit Preview** để quay lại Edit Mode

### Bước 7: Xóa Event (nếu cần)
1. Trong tab Events, tìm event bạn muốn xóa
2. Click nút **X** (màu đỏ) để xóa event

---

## 💡 Ví dụ thực tế

### Ví dụ 1: Button "Go to Dashboard"

**Mục tiêu:** Tạo một button, khi click sẽ chuyển đến trang Dashboard.

**Các bước:**
1. Kéo **Button** vào Canvas
2. Chọn button, vào tab **Events**
3. Click **+** bên cạnh `onClick`
4. Chọn Action Type: **Navigate to Page**
5. Nhập Route: `/`
6. Save và Preview
7. Click button → Sẽ chuyển đến Dashboard

---

### Ví dụ 2: Input với Notification

**Mục tiêu:** Khi người dùng thay đổi giá trị input, hiển thị thông báo.

**Các bước:**
1. Kéo **Input Field** vào Canvas
2. Chọn input, vào tab **Events**
3. Click **+** bên cạnh `onChange`
4. Chọn Action Type: **Show Notification**
5. Nhập Message: `Giá trị đã thay đổi!`
6. Save và Preview
7. Gõ vào input → Sẽ hiển thị notification

---

### Ví dụ 3: Button gọi API

**Mục tiêu:** Tạo button để lấy thống kê từ API.

**Các bước:**
1. Kéo **Button** vào Canvas
2. Đổi label thành "Load Stats"
3. Chọn button, vào tab **Events**
4. Click **+** bên cạnh `onClick`
5. Chọn Action Type: **Call API**
6. Nhập Endpoint: `/dashboard/stats`
7. Chọn Method: `GET`
8. Bật Show Result: (có thể thêm checkbox sau)
9. Save và Preview
10. Click button → Sẽ gọi API và hiển thị kết quả

**Config JSON:**
```json
{
  "type": "api",
  "config": {
    "endpoint": "/dashboard/stats",
    "method": "GET",
    "showResult": true
  }
}
```

---

### Ví dụ 4: Card clickable với nhiều events

**Mục tiêu:** Tạo một card có thể click, khi click sẽ:
1. Hiển thị notification
2. Chuyển đến trang khác

**Lưu ý:** Hiện tại mỗi event type chỉ có thể có 1 action. Để có nhiều actions, bạn cần tạo nhiều events khác nhau hoặc nâng cấp hệ thống sau.

**Các bước:**
1. Kéo **Card** vào Canvas
2. Chọn card, vào tab **Events**
3. Click **+** bên cạnh `onClick`
4. Chọn Action Type: **Navigate to Page**
5. Nhập Route: `/tasks`
6. Save và Preview
7. Click card → Sẽ chuyển đến trang Tasks

---

### Ví dụ 5: Form Submit với API POST

**Mục tiêu:** Tạo button submit form, gọi API để tạo mới todo item.

**Các bước:**
1. Kéo **Input Field** và **Button** vào Canvas
2. Đổi label button thành "Submit"
3. Chọn button, vào tab **Events**
4. Click **+** bên cạnh `onClick`
5. Chọn Action Type: **Call API**
6. Nhập Endpoint: `/todoitems`
7. Chọn Method: `POST`
8. Nhập Params (JSON):
```json
{
  "title": "New Task from Builder",
  "todoListId": 1
}
```
9. Bật Show Result: true
10. Save và Preview
11. Click button → Sẽ gọi API POST và hiển thị kết quả

---

## 🔧 Troubleshooting

### Event không hoạt động?

**Kiểm tra:**
1. ✅ Bạn đã vào **Preview Mode** chưa? (Events chỉ hoạt động trong Preview)
2. ✅ Component có hỗ trợ event type đó không?
3. ✅ Event đã được thêm và cấu hình đúng chưa?
4. ✅ Action Config đã điền đầy đủ chưa?

**Giải pháp:**
- Đảm bảo bạn đang ở Preview Mode (nút Preview ở thanh công cụ)
- Kiểm tra lại tab Events, đảm bảo event đã được thêm (có nút X màu đỏ)
- Kiểm tra Action Config, đảm bảo các field bắt buộc đã được điền

---

### API call bị lỗi?

**Kiểm tra:**
1. ✅ Endpoint có đúng không? (không cần `/api` prefix)
2. ✅ Method có đúng không? (GET, POST, PUT, DELETE)
3. ✅ Params có phải JSON hợp lệ không?
4. ✅ Bạn đã đăng nhập chưa? (API cần authentication)

**Giải pháp:**
- Endpoint phải là relative path: `/dashboard/stats` (không phải `/api/dashboard/stats`)
- Params phải là JSON hợp lệ, ví dụ: `{"key": "value"}`
- Đảm bảo bạn đã đăng nhập và có token trong localStorage

---

### Navigate không hoạt động?

**Kiểm tra:**
1. ✅ Route có đúng không? (phải bắt đầu bằng `/`)
2. ✅ Route có tồn tại trong ứng dụng không?

**Giải pháp:**
- Route phải là đường dẫn hợp lệ trong ứng dụng
- Ví dụ: `/`, `/dashboard`, `/tasks`, `/marketplace`, `/builder/:projectId`

---

### Notification không hiển thị?

**Kiểm tra:**
1. ✅ Message đã được điền chưa?
2. ✅ Event đã được trigger chưa? (click, change...)

**Giải pháp:**
- Đảm bảo message không rỗng
- Kiểm tra console để xem có lỗi không

---

## 📌 Best Practices

### 1. Đặt tên rõ ràng
- Sử dụng label mô tả cho button/card
- Ví dụ: "Go to Dashboard" thay vì "Button 1"

### 2. Test trong Preview Mode
- Luôn test events trong Preview Mode
- Events không hoạt động trong Edit Mode

### 3. Lưu project thường xuyên
- Lưu project sau khi cấu hình events
- Events được lưu vào `item.props.events`

### 4. Validate Action Config
- Đảm bảo các field bắt buộc đã được điền
- Kiểm tra format JSON cho API params

### 5. Sử dụng đúng Event Type
- `onClick` cho button, card, container
- `onChange` cho input, select, checkbox
- `onFocus`/`onBlur` cho input (nếu cần)

---

## 🚀 Tính năng nâng cao (Sẽ triển khai sau)

### 1. Multiple Actions cho một Event
- Hiện tại: 1 event = 1 action
- Tương lai: 1 event = nhiều actions (chạy tuần tự)

### 2. Conditional Actions
- Thực thi action dựa trên điều kiện
- Ví dụ: Nếu `user.role === 'admin'` thì navigate đến `/admin`

### 3. Toast Notifications
- Thay thế alert bằng toast notification đẹp hơn
- Có thể tự động ẩn sau vài giây

### 4. Modal Component thật
- Tạo modal component có thể tái sử dụng
- Có thể chứa form, content động

### 5. Global Variables Manager
- Quản lý biến toàn cục
- Update Variable action sẽ hoạt động đầy đủ

### 6. Event History/Debug
- Xem log các events đã được trigger
- Debug dễ dàng hơn

---

## 📚 Tài liệu tham khảo

- [Professional Features Prompts](./Professional_Features_Prompts.md) - Tài liệu kỹ thuật về Event System
- [Toolbox Items](./Toolbox_Items.md) - Danh sách các component có sẵn

---

## ❓ Câu hỏi thường gặp (FAQ)

### Q: Tôi có thể thêm nhiều events cho một component không?
**A:** Có! Mỗi component có thể có nhiều event types khác nhau (onClick, onChange...). Mỗi event type có thể có 1 action.

### Q: Events có hoạt động khi publish app không?
**A:** Có! Events được lưu trong `item.props.events` và sẽ hoạt động khi app được publish và chạy.

### Q: Tôi có thể sử dụng events với component tự tạo không?
**A:** Hiện tại chỉ các component có trong TOOLS mới hỗ trợ events. Component tự tạo sẽ được hỗ trợ sau.

### Q: Làm sao để test events mà không cần vào Preview Mode?
**A:** Hiện tại không thể. Events chỉ hoạt động trong Preview Mode để tránh conflict với chế độ Edit.

### Q: API endpoint có cần prefix `/api` không?
**A:** Không! Chỉ cần relative path. Ví dụ: `/dashboard/stats` thay vì `/api/dashboard/stats`. Hệ thống sẽ tự động thêm prefix.

---

**Cập nhật lần cuối:** 11/27/2025

