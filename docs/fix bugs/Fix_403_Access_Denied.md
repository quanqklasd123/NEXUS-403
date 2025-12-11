# Sửa lỗi 403 Access Denied - Google Calendar OAuth

## Vấn đề

Khi kết nối Google Calendar, bạn gặp lỗi:
```
403 Access Denied
```

## Nguyên nhân

Lỗi này xảy ra khi:
1. **OAuth Consent Screen chưa được cấu hình đúng**
2. **User chưa được thêm vào Test Users** (nếu app đang ở chế độ Testing)
3. **Scopes chưa được yêu cầu đúng cách**
4. **App chưa được publish** (nếu là External app)

## Giải pháp

### Bước 1: Kiểm tra OAuth Consent Screen

1. Mở [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **OAuth consent screen**
4. Kiểm tra các thông tin sau:

#### a) User Type
- Nếu chọn **External**: Bạn cần thêm user vào Test users (xem Bước 2)
- Nếu chọn **Internal**: Chỉ user trong domain Google Workspace mới dùng được

**Khuyến nghị cho development**: Chọn **External** và thêm test users

#### b) App Information
- **App name**: Tên ứng dụng (ví dụ: "Todo App Calendar")
- **User support email**: Email của bạn
- **Developer contact information**: Email của bạn

#### c) Scopes
Đảm bảo đã thêm các scopes sau:
- ✅ `https://www.googleapis.com/auth/calendar`
- ✅ `https://www.googleapis.com/auth/calendar.events`
- ✅ `https://www.googleapis.com/auth/userinfo.email` (nếu cần)

#### d) Test Users (QUAN TRỌNG!)
Nếu app ở chế độ **Testing**:
- Click vào **+ ADD USERS**
- Thêm email Google của bạn (ví dụ: `tvquan2004@gmail.com`)
- Click **ADD**
- Click **SAVE**

### Bước 2: Thêm Test Users

**Đây là bước QUAN TRỌNG nhất!**

1. Trong **OAuth consent screen**
2. Cuộn xuống phần **Test users**
3. Click **+ ADD USERS**
4. Nhập email Google của bạn:
   ```
   tvquan2004@gmail.com
   ```
   (hoặc email bạn muốn test)
5. Click **ADD**
6. Click **SAVE** ở cuối trang

**⚠️ LƯU Ý:**
- Nếu app đang ở chế độ **Testing**, chỉ những user được thêm vào **Test users** mới có thể sử dụng
- Mỗi khi thêm user mới, hãy click **SAVE** để lưu thay đổi

### Bước 3: Kiểm tra Publishing Status

Trong **OAuth consent screen**, bạn sẽ thấy:

- **Testing**: App đang ở chế độ test, chỉ test users mới dùng được
- **In production**: App đã publish, mọi user đều dùng được (cần verify)

**Với development**: Giữ ở chế độ **Testing** và thêm test users

### Bước 4: Xóa cache và thử lại

1. **Xóa cache trình duyệt**:
   - Chrome: Ctrl + Shift + Delete
   - Chọn "Cookies and other site data"
   - Chọn "All time"
   - Click "Clear data"

2. **Hoặc dùng Incognito/Private mode**:
   - Chrome: Ctrl + Shift + N
   - Thử kết nối lại Google Calendar

3. **Thử kết nối lại**:
   - Vào Settings trong ứng dụng
   - Click "Kết nối Google Calendar"
   - Đăng nhập và cấp quyền

---

## Checklist

- [ ] OAuth Consent Screen đã được cấu hình:
  - [ ] User Type: External
  - [ ] App name đã điền
  - [ ] Email support đã điền
  - [ ] Scopes đã thêm:
    - [ ] `https://www.googleapis.com/auth/calendar`
    - [ ] `https://www.googleapis.com/auth/calendar.events`
- [ ] Test users đã được thêm:
  - [ ] Email của bạn đã thêm vào Test users
  - [ ] Đã click SAVE sau khi thêm
- [ ] Đã xóa cache trình duyệt hoặc dùng Incognito mode
- [ ] Đã thử kết nối lại

---

## Troubleshooting

### Vẫn bị lỗi 403 sau khi thêm Test Users?

1. **Đợi 5-10 phút**: Thay đổi có thể mất vài phút để có hiệu lực
2. **Kiểm tra email**: Đảm bảo email trong Test users chính xác
3. **Logout và Login lại**: Logout khỏi Google, login lại rồi thử
4. **Kiểm tra scopes**: Đảm bảo scopes trong code khớp với OAuth Consent Screen

### Muốn publish app cho mọi user?

Nếu muốn publish app để mọi user đều dùng được (không cần thêm vào test users):

1. Vào **OAuth consent screen**
2. Click **PUBLISH APP**
3. **⚠️ CẢNH BÁO**: 
   - App cần được Google verify nếu có sensitive scopes
   - Quá trình verify có thể mất vài tuần
   - Với development, nên giữ ở chế độ Testing

**Khuyến nghị**: Giữ ở chế độ Testing và thêm test users

---

## Lưu ý

- **Development**: Dùng chế độ Testing + Test users
- **Production**: Cần publish và verify app
- Mỗi khi thêm scope mới, cần thêm vào OAuth Consent Screen

---

**Last Updated**: 2025-01-03

