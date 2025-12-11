# Cách xem dữ liệu trên MongoDB Atlas

## Cách 1: Sử dụng MongoDB Atlas Web Interface (Dễ nhất)

### Bước 1: Đăng nhập MongoDB Atlas
1. Truy cập: https://cloud.mongodb.com/
2. Đăng nhập với tài khoản của bạn

### Bước 2: Chọn Cluster
1. Chọn cluster `nexus-cluster` (hoặc cluster bạn đang dùng)
2. Click vào tên cluster

### Bước 3: Vào Collections
1. Click nút **"Browse Collections"** (hoặc **"Collections"** tab)
2. Chọn database: **NexusDb** (hoặc database name bạn đã cấu hình)
3. Bạn sẽ thấy các collections:
   - `projects` - Dữ liệu projects
   - `todoLists` - Dữ liệu todo lists
   - `todoItems` - Dữ liệu todo items
   - `userApps` - Dữ liệu user apps
   - `googleCalendarTokens` - Google Calendar tokens
   - `taskCalendarEvents` - Calendar events

### Bước 4: Xem dữ liệu
1. Click vào collection bạn muốn xem (ví dụ: `projects`)
2. Bạn sẽ thấy danh sách documents (dữ liệu) trong collection đó
3. Click vào một document để xem chi tiết

## Cách 2: Sử dụng MongoDB Compass (Desktop App)

### Bước 1: Download MongoDB Compass
1. Truy cập: https://www.mongodb.com/try/download/compass
2. Download và cài đặt MongoDB Compass

### Bước 2: Kết nối
1. Mở MongoDB Compass
2. Dán connection string vào:
   ```
   mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?appName=nexus-cluster&tls=true&retryWrites=true&w=majority
   ```
3. Click **Connect**

### Bước 3: Xem dữ liệu
1. Chọn database: **NexusDb**
2. Chọn collection bạn muốn xem
3. Xem và chỉnh sửa dữ liệu trực tiếp

## Cách 3: Sử dụng API Endpoint (Từ code)

Tôi sẽ tạo một endpoint để xem dữ liệu thông qua API.

