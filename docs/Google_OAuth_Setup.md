# Hướng dẫn cấu hình Google OAuth

## Lỗi: "The given origin is not allowed for the given client ID"

Lỗi này xảy ra khi origin (URL) của frontend chưa được thêm vào Google Cloud Console.

## Cách khắc phục:

### Bước 1: Vào Google Cloud Console
1. Truy cập: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**

### Bước 2: Tìm OAuth 2.0 Client ID
1. Tìm Client ID của bạn (ví dụ: `YOUR_CLIENT_ID.apps.googleusercontent.com`)
2. Click vào để chỉnh sửa

### Bước 3: Thêm Authorized JavaScript origins
Thêm các origin sau vào **Authorized JavaScript origins**:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite backup)
- `http://localhost:3000` (React default)
- `http://localhost:5173/` (với trailing slash)

### Bước 4: Thêm Authorized redirect URIs (nếu cần)
Thêm các redirect URI sau:
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:3000`
- `http://localhost:5205/api/google-calendar/callback` (cho Google Calendar)

### Bước 5: Lưu và đợi vài phút
- Click **Save**
- Đợi 1-2 phút để Google cập nhật
- Refresh trang frontend và thử lại

## Lưu ý:
- Nếu deploy lên production, cần thêm domain production vào danh sách
- Không được dùng `localhost` trong production
- FedCM (useOneTap) có thể không hoạt động trên một số browser, đã tắt tạm thời

