# Sửa lỗi redirect_uri_mismatch - Google Calendar OAuth

## Vấn đề

Khi kết nối Google Calendar, bạn gặp lỗi:
```
Error 400: redirect_uri_mismatch
```

## Nguyên nhân

Redirect URI trong Google Cloud Console không khớp với redirect URI mà ứng dụng gửi đi.

## Giải pháp

### Bước 1: Kiểm tra Redirect URI trong code

Redirect URI hiện tại trong `appsettings.json`:
```
http://localhost:5205/api/google-calendar/callback
```

### Bước 2: Thêm Redirect URI vào Google Cloud Console

1. Mở [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Tìm OAuth 2.0 Client ID của bạn (Client ID: `YOUR_CLIENT_ID`)
5. Click vào tên của OAuth client để chỉnh sửa
6. Cuộn xuống phần **Authorized redirect URIs**
7. Click **+ ADD URI**
8. Thêm chính xác URI sau (QUAN TRỌNG: Gõ lại từ đầu, không copy-paste, không có khoảng trắng):
   ```
   http://localhost:5205/api/google-calendar/callback
   ```
   **⚠️ LƯU Ý:**
   - Nếu thấy lỗi "cannot contain whitespace", hãy **XÓA** URI cũ
   - **Gõ lại từ đầu** hoặc copy URI từ `appsettings.json` (dòng 20)
   - Đảm bảo không có khoảng trắng ở đầu/cuối hoặc giữa URI
   - Tốt nhất là gõ tay từ đầu để tránh ký tự ẩn
9. Click **SAVE**

### Bước 3: Kiểm tra lại

**QUAN TRỌNG**: Đảm bảo:
- ✅ URI phải khớp **chính xác** (kể cả `http` vs `https`)
- ✅ Không có dấu `/` thừa ở cuối
- ✅ Port `5205` phải đúng với port backend đang chạy

### Bước 4: Restart Backend Server

Sau khi cập nhật Google Cloud Console, restart backend server để đảm bảo cấu hình mới được áp dụng.

### Bước 5: Test lại

1. Vào trang Settings trong ứng dụng
2. Click "Kết nối Google Calendar"
3. Đăng nhập và cấp quyền
4. Kiểm tra xem có redirect về ứng dụng thành công không

---

## Lưu ý cho Production

Khi deploy lên production, bạn cần:

1. Tạo OAuth client mới cho production domain
2. Cập nhật redirect URI trong Google Cloud Console:
   ```
   https://yourdomain.com/api/google-calendar/callback
   ```
3. Cập nhật `appsettings.json` (hoặc environment variables) với:
   - Client ID mới
   - Client Secret mới
   - Redirect URI mới (với `https`)

---

## Troubleshooting

### Vẫn bị lỗi sau khi thêm URI?

1. **Đợi vài phút**: Google Cloud Console có thể mất 1-2 phút để cập nhật
2. **Xóa cache trình duyệt**: Clear cache và cookies
3. **Kiểm tra lại từng ký tự**: Copy-paste URI từ `appsettings.json` để đảm bảo chính xác
4. **Kiểm tra port**: Đảm bảo backend đang chạy đúng port `5205`

### Multiple redirect URIs

Bạn có thể thêm nhiều redirect URIs cho development và production:

```
http://localhost:5205/api/google-calendar/callback
https://yourdomain.com/api/google-calendar/callback
```

---

**Last Updated**: 2025-01-03

