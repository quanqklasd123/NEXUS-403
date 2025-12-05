# Sửa lỗi Callback sau khi Publish App - Google Calendar OAuth

## Vấn đề

Sau khi publish app, khi user kết nối Google Calendar, gặp lỗi callback hoặc redirect không hoạt động.

## Nguyên nhân có thể

1. **Redirect URI không khớp** giữa Google Cloud Console và code
2. **Callback endpoint không xử lý đúng** khi app ở chế độ Production
3. **State parameter bị lỗi** hoặc không được verify đúng
4. **Frontend URL chưa được cấu hình** đúng

## Giải pháp

### Bước 1: Kiểm tra Redirect URI trong Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Tìm OAuth 2.0 Client ID của bạn
5. Click vào để chỉnh sửa
6. Kiểm tra phần **Authorized redirect URIs**:
   
   Phải có chính xác:
   ```
   http://localhost:5205/api/google-calendar/callback
   ```
   
   (hoặc domain production nếu deploy)

7. Click **SAVE**

### Bước 2: Kiểm tra Callback Endpoint

Callback endpoint phải:
- ✅ Nhận được `code` và `state` từ query parameters
- ✅ Decode `state` để lấy `userId`
- ✅ Xử lý OAuth flow
- ✅ Redirect về frontend

Kiểm tra trong `TodoApi/Controllers/GoogleCalendarController.cs`:

```csharp
[HttpGet("callback")]
[AllowAnonymous] // QUAN TRỌNG: Phải có để Google có thể redirect về
public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state)
{
    // ... xử lý callback
}
```

### Bước 3: Kiểm tra Frontend URL trong appsettings.json

Đảm bảo `FrontendUrl` được cấu hình đúng trong `appsettings.json`:

```json
{
  "FrontendUrl": "http://localhost:5173"
}
```

Nếu chưa có, thêm vào:

1. Mở `TodoApi/appsettings.json`
2. Thêm dòng sau vào cuối (trước dấu `}` cuối):

```json
{
  "FrontendUrl": "http://localhost:5173",
  // ... các config khác
}
```

3. Restart backend server

### Bước 4: Kiểm tra State Parameter

State parameter được encode với `userId`. Đảm bảo:
- ✅ State được encode đúng khi tạo auth URL
- ✅ State được decode đúng trong callback
- ✅ UserId được lấy chính xác từ state

### Bước 5: Xử lý lỗi trong Callback

Cải thiện error handling trong callback:

```csharp
[HttpGet("callback")]
[AllowAnonymous]
public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
{
    // Nếu có error từ Google
    if (!string.IsNullOrEmpty(error))
    {
        _logger.LogWarning("OAuth error from Google: {Error}", error);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        return Redirect($"{frontendUrl}/settings?google-calendar-error={Uri.EscapeDataString(error)}");
    }
    
    // ... xử lý bình thường
}
```

### Bước 6: Kiểm tra CORS và CORS Headers

Đảm bảo CORS cho phép redirect:

1. Kiểm tra `Program.cs`:
   ```csharp
   builder.Services.AddCors(options =>
   {
       options.AddPolicy(name: MyAllowSpecificOrigins,
           policy =>
           {
               policy.WithOrigins(
                   "http://localhost:5173",
                   "http://localhost:5174",
                   "http://localhost:3000"
               )
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
           });
   });
   ```

2. Đảm bảo middleware CORS được sử dụng đúng thứ tự

### Bước 7: Logging và Debugging

Thêm logging để debug:

```csharp
_logger.LogInformation("Callback received - Code: {HasCode}, State: {HasState}", 
    !string.IsNullOrEmpty(code), !string.IsNullOrEmpty(state));
```

Kiểm tra logs trong console khi test callback.

---

## Checklist

- [ ] Redirect URI trong Google Cloud Console khớp với code
- [ ] Callback endpoint có `[AllowAnonymous]`
- [ ] FrontendUrl được cấu hình trong appsettings.json
- [ ] State parameter được encode/decode đúng
- [ ] Error handling đầy đủ trong callback
- [ ] CORS được cấu hình đúng
- [ ] Logging được bật để debug

---

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"

- Kiểm tra lại Redirect URI trong Google Cloud Console
- Đảm bảo URI khớp chính xác 100% (kể cả http/https)

### Lỗi: "invalid_state"

- State parameter bị lỗi khi encode/decode
- Kiểm tra lại logic encode state với userId

### Lỗi: "access_denied"

- User từ chối cấp quyền
- App chưa được verify (nếu ở production)
- User chưa được thêm vào test users (nếu ở testing)

### Callback không được gọi

- Kiểm tra Redirect URI có đúng không
- Kiểm tra network tab trong browser DevTools
- Kiểm tra firewall/antivirus có block không

---

## Test Flow

1. Click "Kết nối Google Calendar" trong app
2. Đăng nhập và cấp quyền trên Google
3. Google sẽ redirect về: `http://localhost:5205/api/google-calendar/callback?code=...&state=...`
4. Backend xử lý callback
5. Backend redirect về: `http://localhost:5173/settings?google-calendar-connected=true`

---

**Last Updated**: 2025-01-03

