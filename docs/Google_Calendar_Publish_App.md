# Publish Google Calendar App để mọi user đều dùng được

## Vấn đề

Hiện tại app đang ở chế độ **Testing**, nên chỉ những user được thêm vào **Test users** mới có thể kết nối Google Calendar. Bạn muốn **bất kỳ user nào** đăng nhập với Google đều có thể kết nối.

## Giải pháp: Publish App

Để mọi user đều có thể sử dụng, bạn cần **Publish** app trong OAuth Consent Screen.

---

## Cách Publish App

### Bước 1: Kiểm tra OAuth Consent Screen

1. Mở [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **OAuth consent screen**

### Bước 2: Hoàn thiện thông tin App

Đảm bảo các thông tin sau đã được điền đầy đủ:

#### a) App Information
- ✅ **App name**: Tên ứng dụng (ví dụ: "Todo App Calendar")
- ✅ **User support email**: Email của bạn (phải là email hợp lệ)
- ✅ **App logo**: (Tùy chọn, nhưng nên có)
- ✅ **App domain**: Domain của bạn (nếu có)
- ✅ **Application home page**: URL trang chủ (nếu có)
- ✅ **Application privacy policy link**: (Bắt buộc nếu publish)
- ✅ **Application terms of service link**: (Tùy chọn)

#### b) Developer contact information
- ✅ **Email addresses**: Email của bạn (Google sẽ liên hệ qua email này)

#### c) Scopes
Đảm bảo đã thêm các scopes:
- ✅ `https://www.googleapis.com/auth/calendar`
- ✅ `https://www.googleapis.com/auth/calendar.events`
- ✅ `https://www.googleapis.com/auth/userinfo.email`

### Bước 3: Privacy Policy và Terms of Service

**QUAN TRỌNG**: Để publish, bạn **BẮT BUỘC** phải có:
- **Privacy Policy URL**: URL đến trang chính sách bảo mật
- **Terms of Service URL**: (Tùy chọn nhưng nên có)

#### Tạo Privacy Policy đơn giản:

Bạn có thể tạo một trang HTML đơn giản và host trên GitHub Pages hoặc bất kỳ hosting nào:

**Privacy Policy Template** (lưu vào file `privacy-policy.html`):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Privacy Policy - Todo App Calendar</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p><strong>Last updated:</strong> [Ngày hiện tại]</p>
    
    <h2>1. Data Collection</h2>
    <p>Todo App Calendar collects the following information:</p>
    <ul>
        <li>Google Calendar access token (stored securely)</li>
        <li>Task information you create</li>
        <li>Email address (from Google account)</li>
    </ul>
    
    <h2>2. Data Usage</h2>
    <p>We use your data to:</p>
    <ul>
        <li>Create calendar events for your tasks</li>
        <li>Send you notifications when tasks are due</li>
        <li>Improve our service</li>
    </ul>
    
    <h2>3. Data Storage</h2>
    <p>Your data is stored securely on our servers. We do not share your data with third parties.</p>
    
    <h2>4. Your Rights</h2>
    <p>You can:</p>
    <ul>
        <li>Disconnect Google Calendar at any time</li>
        <li>Delete your account and all associated data</li>
        <li>Request access to your data</li>
    </ul>
    
    <h2>5. Contact Us</h2>
    <p>If you have questions about this Privacy Policy, please contact us at: [Email của bạn]</p>
</body>
</html>
```

**Lưu ý**: 
- Host file này trên một URL công khai (GitHub Pages, Netlify, Vercel, etc.)
- URL phải là `https://` (Google yêu cầu)

#### Ví dụ URLs:
- GitHub Pages: `https://[username].github.io/privacy-policy.html`
- Netlify: `https://[your-site].netlify.app/privacy-policy.html`

### Bước 4: Publish App

1. Trong **OAuth consent screen**, cuộn xuống phần **Publishing status**
2. Bạn sẽ thấy:
   - **Status**: Testing
   - Nút **PUBLISH APP**

3. Click **PUBLISH APP**
4. Xác nhận bằng cách click **CONFIRM**

### Bước 5: Chờ Google Review (nếu cần)

#### a) Nếu app dùng **Sensitive Scopes** (như Calendar API):
- Google sẽ yêu cầu **verification** (xác minh)
- Quá trình này có thể mất **vài tuần đến vài tháng**
- Trong thời gian chờ, app sẽ ở trạng thái **"In production"** nhưng chưa được verify
- User sẽ thấy cảnh báo **"Unverified app"** khi sử dụng

#### b) Nếu app chỉ dùng **Non-sensitive scopes**:
- App sẽ được publish ngay lập tức
- Mọi user có thể sử dụng không cần verify

#### c) Với Google Calendar API:
- Calendar scopes thường là **Sensitive scopes**
- Cần verification từ Google
- Trong thời gian chờ verification, user vẫn có thể dùng nhưng sẽ thấy cảnh báo

### Bước 6: Quá trình Verification (nếu cần)

Nếu Google yêu cầu verification:

1. **Hoàn thiện thông tin app**:
   - Privacy Policy URL
   - Terms of Service URL
   - App domain và home page
   - Video demo (nếu được yêu cầu)

2. **Submit for verification**:
   - Google sẽ review app của bạn
   - Có thể yêu cầu thêm thông tin
   - Thời gian: 2-6 tuần

3. **Sau khi verify**:
   - App sẽ được verify
   - User sẽ không thấy cảnh báo "Unverified app" nữa

---

## Lưu ý quan trọng

### ✅ Ưu điểm của Publishing:
- Mọi user có thể sử dụng (không cần thêm vào test users)
- App có thể scale lên nhiều user

### ⚠️ Nhược điểm:
- Cần Privacy Policy URL (bắt buộc)
- Cần Terms of Service (nên có)
- Nếu dùng sensitive scopes: Cần verification từ Google (mất thời gian)
- User sẽ thấy cảnh báo "Unverified app" trong thời gian chờ verification

### 🎯 Khuyến nghị:

**Cho Development/Testing:**
- Giữ ở chế độ **Testing**
- Thêm test users khi cần

**Cho Production:**
- **Publish** app
- Tạo Privacy Policy và Terms of Service
- Submit for verification nếu dùng sensitive scopes
- Trong thời gian chờ verification, user vẫn có thể dùng (có cảnh báo)

---

## Alternative: Sử dụng Restricted Scopes

Nếu bạn muốn tránh verification, có thể:

1. Sử dụng scopes ít sensitive hơn (nhưng vẫn cần Calendar API)
2. Request scopes chỉ khi thực sự cần
3. Giải thích rõ ràng với user về cách app sử dụng data

Tuy nhiên, với Google Calendar API, scopes thường là sensitive và vẫn cần verification.

---

## Checklist

- [ ] Privacy Policy URL đã có và accessible
- [ ] Terms of Service URL (tùy chọn)
- [ ] App information đã điền đầy đủ
- [ ] Developer contact email đã điền
- [ ] Scopes đã được thêm đúng
- [ ] Đã click PUBLISH APP
- [ ] Đã submit for verification (nếu được yêu cầu)
- [ ] Đã test với user không có trong test users

---

**Last Updated**: 2025-01-03

