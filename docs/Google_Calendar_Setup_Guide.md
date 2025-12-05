# Hướng dẫn Setup Google Calendar API

## Tổng quan

File này hướng dẫn từng bước để setup Google Calendar API cho tính năng thông báo task.

---

## Bước 1: Tạo Google Cloud Project

### 1.1. Truy cập Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập bằng tài khoản Google của bạn

### 1.2. Tạo Project mới

1. Click vào dropdown **Project** ở thanh trên cùng (bên cạnh logo Google Cloud)
2. Click **"New Project"**
3. Điền thông tin:
   - **Project name**: `TodoApp Calendar Integration` (hoặc tên khác)
   - **Location**: Chọn organization (nếu có) hoặc để trống
4. Click **"Create"**
5. Đợi vài giây để project được tạo

---

## Bước 2: Enable Google Calendar API

### 2.1. Vào API Library

1. Trong Google Cloud Console, tìm và click vào **"APIs & Services"** → **"Library"** (hoặc truy cập trực tiếp: https://console.cloud.google.com/apis/library)
2. Đảm bảo project vừa tạo đã được chọn ở dropdown trên cùng

### 2.2. Enable Calendar API

1. Trong ô tìm kiếm, gõ **"Google Calendar API"**
2. Click vào **"Google Calendar API"** trong kết quả
3. Click nút **"Enable"**
4. Đợi vài giây để API được enable

---

## Bước 3: Cấu hình OAuth Consent Screen

### 3.1. Vào OAuth Consent Screen

1. Vào **"APIs & Services"** → **"OAuth consent screen"**
2. Chọn **"External"** (hoặc **"Internal"** nếu bạn có Google Workspace)
3. Click **"Create"**

### 3.2. Điền thông tin App

**App information:**
- **App name**: `TodoApp` (hoặc tên bạn muốn)
- **User support email**: Email của bạn
- **App logo**: (Optional) Upload logo nếu có
- **Application home page**: `http://localhost:5173` (hoặc URL của app)
- **Application privacy policy link**: (Optional) Có thể để trống cho dev
- **Application terms of service link**: (Optional) Có thể để trống cho dev
- **Authorized domains**: (Optional) Có thể để trống cho dev
- **Developer contact information**: Email của bạn

Click **"Save and Continue"**

### 3.3. Scopes

1. Click **"Add or Remove Scopes"**
2. Tìm và chọn các scopes sau:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. Click **"Update"** → **"Save and Continue"**

### 3.4. Test Users (nếu là External app)

1. Thêm email của bạn vào **"Test users"**
2. Click **"Save and Continue"**
3. Review và **"Back to Dashboard"**

---

## Bước 4: Tạo OAuth 2.0 Credentials

### 4.1. Vào Credentials

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**

### 4.2. Cấu hình OAuth Client

**Application type**: Chọn **"Web application"**

**Name**: `TodoApp Web Client` (hoặc tên khác)

**Authorized JavaScript origins**:
```
http://localhost:5173
http://localhost:5174
http://localhost:3000
http://localhost:5205
```

**Authorized redirect URIs**:
```
http://localhost:5205/api/google-calendar/callback
http://localhost:5173/auth/google/callback
```

> **Lưu ý**: Khi deploy production, thay thế `localhost` bằng domain thực tế của bạn.

### 4.3. Lưu Credentials

1. Click **"Create"**
2. Một popup sẽ hiện ra với:
   - **Client ID**
   - **Client Secret**
3. **QUAN TRỌNG**: Copy và lưu cả 2 giá trị này ngay, vì Client Secret chỉ hiển thị 1 lần!

---

## Bước 5: Cấu hình trong Backend

### 5.1. Cập nhật appsettings.json

Mở file `TodoApi/appsettings.json` và cập nhật:

```json
{
  "GoogleCalendar": {
    "ClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "ClientSecret": "YOUR_CLIENT_SECRET",
    "RedirectUri": "http://localhost:5205/api/google-calendar/callback",
    "Scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ]
  }
}
```

**Lưu ý**:
- Thay `YOUR_CLIENT_ID` và `YOUR_CLIENT_SECRET` bằng giá trị từ Bước 4.3
- Đảm bảo `RedirectUri` khớp với **Authorized redirect URIs** đã cấu hình

### 5.2. Kiểm tra NuGet Packages

Đảm bảo các packages sau đã được cài:

```xml
<PackageReference Include="Google.Apis.Auth" Version="1.72.0" />
<PackageReference Include="Google.Apis.Calendar.v3" Version="1.72.0.3785" />
```

Nếu chưa có, chạy:
```bash
cd TodoApi
dotnet add package Google.Apis.Calendar.v3
```

---

## Bước 6: Kiểm tra Setup

### 6.1. Chạy Migration

Tạo và chạy migration cho database:

```bash
cd TodoApi
dotnet ef migrations add AddGoogleCalendarTables
dotnet ef database update
```

### 6.2. Test OAuth Flow

1. Start backend server:
   ```bash
   cd TodoApi
   dotnet run
   ```

2. Test endpoint lấy auth URL:
   ```bash
   GET http://localhost:5205/api/google-calendar/auth-url
   ```

3. Copy URL trả về và mở trong browser
4. Đăng nhập và cấp quyền
5. Kiểm tra xem có redirect về callback URL không

---

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"

**Nguyên nhân**: Redirect URI không khớp với cấu hình trong Google Cloud Console

**Giải pháp**:
1. Kiểm tra lại **Authorized redirect URIs** trong Google Cloud Console
2. Đảm bảo redirect URI trong code khớp chính xác (kể cả `http` vs `https`)

### Lỗi: "invalid_client"

**Nguyên nhân**: Client ID hoặc Client Secret sai

**Giải pháp**:
1. Kiểm tra lại `appsettings.json`
2. Đảm bảo không có khoảng trắng thừa
3. Tạo lại credentials nếu cần

### Lỗi: "access_denied"

**Nguyên nhân**: User từ chối cấp quyền hoặc app chưa được verify (External app)

**Giải pháp**:
1. Với External app trong testing: Đảm bảo email user được thêm vào Test users
2. User cần accept và cấp quyền khi được hỏi

### Lỗi: "API not enabled"

**Nguyên nhân**: Google Calendar API chưa được enable

**Giải pháp**:
1. Vào [API Library](https://console.cloud.google.com/apis/library)
2. Tìm "Google Calendar API"
3. Click "Enable"

---

## Checklist Hoàn thành Phase 1.1

- [ ] Đã tạo Google Cloud Project
- [ ] Đã enable Google Calendar API
- [ ] Đã cấu hình OAuth Consent Screen
- [ ] Đã tạo OAuth 2.0 Credentials
- [ ] Đã cập nhật appsettings.json với Client ID và Secret
- [ ] Đã cài đặt NuGet packages cần thiết
- [ ] Đã test OAuth flow (tùy chọn, sẽ test sau khi code xong)

---

## Next Steps

Sau khi hoàn thành Phase 1.1, tiếp tục với:

- **Phase 1.2**: Database Schema (đã tạo models)
- **Phase 2**: Google OAuth Integration (code implementation)

---

**Last Updated**: 2025-01-03  
**Status**: ✅ Ready for Implementation

