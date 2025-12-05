# Tính năng Gửi Thông báo Task bằng Google Calendar

## Tổng quan

Tính năng này cho phép hệ thống tự động gửi thông báo cho người dùng khi task đến hạn thông qua Google Calendar. Hệ thống sẽ gửi 2 thông báo:
1. **Thông báo sớm**: Vào lúc 0h (midnight) của ngày đến hạn task
2. **Thông báo chính**: Đúng giờ phút được set trong `dueDate` của task

### ⚡ Quan trọng: Server Không Cần Chạy Liên Tục

**Có, thông báo vẫn hoạt động khi tắt server!** 

**Cách hoạt động:**
- ✅ **Server chỉ cần chạy khi**: Tạo/cập nhật/xóa task → Tạo/cập nhật/xóa event trong Google Calendar
- ✅ **Sau khi event đã được tạo trong Google Calendar**: Google sẽ **TỰ ĐỘNG** gửi thông báo theo reminders đã set
- ✅ **Google Calendar là dịch vụ cloud của Google**: Chạy trên server của Google, không cần server của bạn chạy

**Ví dụ:**
1. User tạo task với dueDate = "2025-01-15 14:00"
2. Server tạo event trong Google Calendar với 2 reminders (0h ngày 15 và 14:00 ngày 15)
3. Server có thể tắt
4. Google Calendar sẽ tự động gửi thông báo vào đúng thời điểm đã set

**Lưu ý:**
- Background jobs (Hangfire) chỉ cần chạy khi cần sync/create events
- Một khi event đã có trong Google Calendar, Google sẽ tự động handle notifications

---

## Kiến trúc Tổng quan

```
┌─────────────────┐
│   Frontend      │
│  (React App)    │
└────────┬────────┘
         │
         │ OAuth Flow
         │
┌────────▼────────────────────────┐
│   Backend API                   │
│   (ASP.NET Core)                │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Google Calendar Service  │  │
│  │ - OAuth 2.0             │  │
│  │ - Calendar API          │  │
│  │ - Event Creation        │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Background Job Service   │  │
│  │ - Hangfire/Quartz        │  │
│  │ - Scheduled Tasks        │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         │ API Calls
         │
┌────────▼────────────────────────┐
│   Google Calendar API           │
│   - Create Events               │
│   - Send Notifications          │
└─────────────────────────────────┘
```

---

## Các Bước Triển khai

### Phase 1: Setup và Cấu hình

#### 1.1. Google Cloud Platform Setup

**Mục tiêu**: Tạo project và enable Google Calendar API

**Các bước**:
- [x] Tạo Google Cloud Project
- [x] Enable Google Calendar API
- [x] Tạo OAuth 2.0 Credentials (Client ID, Client Secret)
- [x] Cấu hình OAuth consent screen
- [x] Lưu credentials vào appsettings.json (Backend)

**File cần tạo/sửa**:
- `TodoApi/appsettings.json` - Thêm Google OAuth config
- `docs/Google_Calendar_Setup_Guide.md` - Hướng dẫn setup

**Dependencies cần thêm**:
```json
// Backend
{
  "Google.Apis.Calendar": "1.x.x",
  "Google.Apis.Auth": "1.x.x"
}
```

---

#### 1.2. Database Schema

**Mục tiêu**: Thêm các bảng để lưu trữ thông tin Google Calendar integration

**Bảng mới cần tạo**:

**1. GoogleCalendarTokens**
```sql
CREATE TABLE GoogleCalendarTokens (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    AppUserId NVARCHAR(450) NOT NULL,
    AccessToken NVARCHAR(MAX) NOT NULL,
    RefreshToken NVARCHAR(MAX),
    TokenType NVARCHAR(50) DEFAULT 'Bearer',
    ExpiresAt DATETIME2 NOT NULL,
    Scope NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_GoogleCalendarTokens_Users 
        FOREIGN KEY (AppUserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);
```

**2. TaskCalendarEvents**
```sql
CREATE TABLE TaskCalendarEvents (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    TodoItemId BIGINT NOT NULL,
    GoogleEventId NVARCHAR(255) NOT NULL,
    CalendarId NVARCHAR(255) DEFAULT 'primary',
    NotificationSent_00h BIT DEFAULT 0,
    NotificationSent_ExactTime BIT DEFAULT 0,
    NotificationSent_00h_At DATETIME2,
    NotificationSent_ExactTime_At DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_TaskCalendarEvents_TodoItems 
        FOREIGN KEY (TodoItemId) REFERENCES TodoItems(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_TaskCalendarEvents_TodoItemId 
        UNIQUE (TodoItemId)
);
```

**File cần tạo/sửa**:
- [x] `TodoApi/Models/GoogleCalendarToken.cs` ✅
- [x] `TodoApi/Models/TaskCalendarEvent.cs` ✅
- [x] `TodoApi/Data/TodoContext.cs` - Thêm DbSet ✅
- [x] Migration files ✅

---

### Phase 2: Google OAuth Integration

#### 2.1. Backend - OAuth Controller

**Mục tiêu**: Xử lý OAuth flow để lấy access token từ Google

**Endpoint cần tạo**:

**1. GET `/api/google-calendar/auth-url`**
- Trả về URL để redirect user đến Google OAuth consent screen
- Request: Không cần body
- Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**2. GET `/api/google-calendar/callback?code={code}`**
- Xử lý callback từ Google sau khi user đồng ý
- Lưu access token và refresh token vào database
- Redirect về frontend với success message

**3. GET `/api/google-calendar/status`**
- Kiểm tra xem user đã kết nối Google Calendar chưa
- Response:
```json
{
  "isConnected": true,
  "connectedAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-31T00:00:00Z"
}
```

**4. DELETE `/api/google-calendar/disconnect`**
- Xóa connection, revoke token
- Xóa tất cả events đã tạo cho user

**File cần tạo/sửa**:
- `TodoApi/Controllers/GoogleCalendarController.cs`
- `TodoApi/Services/IGoogleCalendarService.cs`
- `TodoApi/Services/GoogleCalendarService.cs`

---

#### 2.2. Frontend - OAuth UI

**Mục tiêu**: Tạo UI để user kết nối Google Calendar

**Component cần tạo**:

**1. GoogleCalendarConnection Component**
- Hiển thị trạng thái kết nối (Connected/Not Connected)
- Button "Connect Google Calendar"
- Button "Disconnect" (nếu đã kết nối)
- Handle OAuth redirect flow

**File cần tạo/sửa**:
- `todo-frontend/src/components/GoogleCalendarConnection.jsx`
- `todo-frontend/src/services/googleCalendarService.js`
- `todo-frontend/src/pages/Settings.jsx` - Thêm section Google Calendar

---

### Phase 3: Tự động tạo Calendar Event

#### 3.1. Backend - Tạo Event Service

**Mục tiêu**: Khi task được tạo/cập nhật với dueDate, tự động tạo Google Calendar event

**Logic**:
1. Khi task có `dueDate`:
   - Kiểm tra user đã kết nối Google Calendar chưa
   - Tạo event trong Google Calendar với:
     - Title: Task title
     - Description: Task details + category
     - Start time: `dueDate`
     - End time: `dueDate + 1 hour` (hoặc configurable)
     - Reminders: 2 reminders
       - Reminder 1: 1 day before (0h của ngày đến hạn)
       - Reminder 2: 0 minutes (đúng giờ đến hạn)
   - Lưu `GoogleEventId` vào database

2. Khi task được cập nhật:
   - Update event trong Google Calendar
   - Nếu `dueDate` bị xóa → xóa event

3. Khi task bị xóa:
   - Xóa event khỏi Google Calendar
   - Xóa record trong `TaskCalendarEvents`

**File cần tạo/sửa**:
- `TodoApi/Services/IGoogleCalendarEventService.cs`
- `TodoApi/Services/GoogleCalendarEventService.cs`
- `TodoApi/Controllers/TodoItemsController.cs` - Thêm logic khi create/update/delete

---

#### 3.2. Background Job để Sync

**Mục tiêu**: Background job để đồng bộ tasks với Google Calendar

**Jobs cần tạo**:

**1. Sync Task to Calendar (On-demand)**
- Chạy khi task được tạo/updated
- Tạo hoặc update calendar event

**2. Daily Sync Job**
- Chạy mỗi ngày lúc 0h
- Kiểm tra các tasks có dueDate trong ngày
- Đảm bảo tất cả đều có calendar event

**3. Cleanup Orphaned Events**
- Chạy hàng tuần
- Tìm và xóa các events không còn liên kết với task

**File cần tạo/sửa**:
- `TodoApi/Services/HangfireJobs/GoogleCalendarSyncJobs.cs`
- `TodoApi/Program.cs` - Cấu hình Hangfire

**Dependencies**:
```json
{
  "Hangfire.AspNetCore": "1.x.x",
  "Hangfire.SqlServer": "1.x.x"
}
```

---

### Phase 4: Notification System

#### 4.1. Reminder Configuration

**Mục tiêu**: Cấu hình reminders trong Google Calendar event

**Reminder Rules**:
- **Reminder 1**: 
  - Method: `email` + `popup`
  - Minutes before: `1440` (1 day = 24 hours * 60 minutes)
  - Trigger time: 0h của ngày đến hạn

- **Reminder 2**:
  - Method: `email` + `popup`
  - Minutes before: `0` (đúng giờ)
  - Trigger time: Đúng giờ phút của dueDate

**Implementation**:
```csharp
var reminders = new Event.RemindersData
{
    UseDefault = false,
    Overrides = new List<EventReminder>
    {
        new EventReminder { Method = "email", Minutes = 1440 }, // 1 day before
        new EventReminder { Method = "popup", Minutes = 1440 },
        new EventReminder { Method = "email", Minutes = 0 },    // At exact time
        new EventReminder { Method = "popup", Minutes = 0 }
    }
};
```

**File cần sửa**:
- `TodoApi/Services/GoogleCalendarEventService.cs` - Thêm reminder config

---

#### 4.2. Tracking Notification Status

**Mục tiêu**: Theo dõi trạng thái notification đã được gửi

**Logic**:
- Khi Google Calendar gửi notification, không có webhook để track
- Cần implement một scheduled job để check và mark notifications

**Alternative Approach**:
- Sử dụng Google Calendar API để check event status
- Hoặc dựa vào logic: Nếu đã qua thời gian → đánh dấu đã gửi

**Job cần tạo**:
- `CheckAndMarkNotifications` - Chạy mỗi giờ
  - Check các tasks có `dueDate` đã qua
  - Check nếu đã đến 0h của ngày đến hạn → mark `NotificationSent_00h`
  - Check nếu đã đến đúng giờ → mark `NotificationSent_ExactTime`

**File cần tạo/sửa**:
- `TodoApi/Services/HangfireJobs/NotificationStatusJobs.cs`

---

### Phase 5: Error Handling và Retry Logic

#### 5.1. Token Refresh

**Mục tiêu**: Tự động refresh access token khi hết hạn

**Logic**:
- Google access token thường hết hạn sau 1 giờ
- Refresh token không hết hạn (trừ khi user revoke)
- Implement automatic token refresh trong service

**Implementation**:
```csharp
public async Task<string> GetValidAccessTokenAsync(string userId)
{
    var token = await _context.GoogleCalendarTokens
        .FirstOrDefaultAsync(t => t.AppUserId == userId);
    
    if (token == null) throw new UnauthorizedException();
    
    // Check if token is expired
    if (token.ExpiresAt <= DateTime.UtcNow)
    {
        // Refresh token
        var newToken = await RefreshAccessTokenAsync(token.RefreshToken);
        // Update in database
        token.AccessToken = newToken.AccessToken;
        token.ExpiresAt = newToken.ExpiresAt;
        await _context.SaveChangesAsync();
    }
    
    return token.AccessToken;
}
```

**File cần sửa**:
- `TodoApi/Services/GoogleCalendarService.cs`

---

#### 5.2. Error Handling

**Các lỗi cần handle**:

1. **Token expired/revoked**
   - Re-authenticate user
   - Show notification trong UI

2. **API Rate Limit**
   - Implement exponential backoff
   - Queue requests

3. **Network errors**
   - Retry với exponential backoff
   - Log errors

4. **Event creation failed**
   - Log error
   - Retry sau đó
   - Fallback: Store để retry sau

**File cần tạo/sửa**:
- `TodoApi/Services/GoogleCalendarEventService.cs` - Thêm error handling
- `TodoApi/Exceptions/GoogleCalendarException.cs`

---

### Phase 6: Testing

#### 6.1. Unit Tests

**Test cases**:
- [ ] OAuth flow
- [ ] Token refresh
- [ ] Event creation
- [ ] Event update
- [ ] Event deletion
- [ ] Reminder configuration

**File cần tạo**:
- `TodoApi.Tests/Services/GoogleCalendarServiceTests.cs`
- `TodoApi.Tests/Services/GoogleCalendarEventServiceTests.cs`

---

#### 6.2. Integration Tests

**Test scenarios**:
- [ ] End-to-end OAuth flow
- [ ] Create task → Verify calendar event created
- [ ] Update task dueDate → Verify event updated
- [ ] Delete task → Verify event deleted
- [ ] Test notifications (cần mock hoặc test account)

**File cần tạo**:
- `TodoApi.Tests/Integration/GoogleCalendarIntegrationTests.cs`

---

#### 6.3. Manual Testing Checklist

- [ ] Connect Google Calendar từ frontend
- [ ] Tạo task với dueDate → Check calendar có event
- [ ] Update task dueDate → Check event được update
- [ ] Xóa task → Check event bị xóa
- [ ] Test với timezone khác nhau
- [ ] Test với nhiều tasks cùng lúc
- [ ] Test token refresh
- [ ] Test disconnect → Verify events bị xóa

---

## Cấu trúc File/Folder

```
TodoApi/
├── Controllers/
│   └── GoogleCalendarController.cs
├── Services/
│   ├── IGoogleCalendarService.cs
│   ├── GoogleCalendarService.cs
│   ├── IGoogleCalendarEventService.cs
│   ├── GoogleCalendarEventService.cs
│   └── HangfireJobs/
│       ├── GoogleCalendarSyncJobs.cs
│       └── NotificationStatusJobs.cs
├── Models/
│   ├── GoogleCalendarToken.cs
│   └── TaskCalendarEvent.cs
├── Exceptions/
│   └── GoogleCalendarException.cs
└── Data/
    └── ApplicationDbContext.cs (update)

todo-frontend/
├── src/
│   ├── components/
│   │   └── GoogleCalendarConnection.jsx
│   ├── services/
│   │   └── googleCalendarService.js
│   └── pages/
│       └── Settings.jsx (update)

docs/
├── Google_Calendar_Notification_Feature.md (this file)
└── Google_Calendar_Setup_Guide.md
```

---

## API Endpoints Summary

### Google Calendar OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/google-calendar/auth-url` | Get OAuth authorization URL |
| GET | `/api/google-calendar/callback` | Handle OAuth callback |
| GET | `/api/google-calendar/status` | Check connection status |
| DELETE | `/api/google-calendar/disconnect` | Disconnect Google Calendar |

### Automatic Event Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/todoitems` | Create task → Auto create calendar event |
| PUT | `/api/todoitems/{id}` | Update task → Auto update calendar event |
| DELETE | `/api/todoitems/{id}` | Delete task → Auto delete calendar event |

---

## Dependencies

### Backend (NuGet Packages)
```
Google.Apis.Calendar (v1.x.x)
Google.Apis.Auth (v1.x.x)
Hangfire.AspNetCore (v1.x.x)
Hangfire.SqlServer (v1.x.x)
```

### Frontend (npm packages)
```
(No additional packages needed - use existing axios)
```

---

## Configuration

### appsettings.json
```json
{
  "GoogleCalendar": {
    "ClientId": "your-client-id.apps.googleusercontent.com",
    "ClientSecret": "your-client-secret",
    "RedirectUri": "https://your-domain.com/api/google-calendar/callback",
    "Scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ]
  },
  "Hangfire": {
    "ConnectionString": "your-connection-string"
  }
}
```

---

## Security Considerations

1. **Token Storage**
   - Lưu tokens trong database, encrypt sensitive data
   - Không log access tokens

2. **OAuth Flow**
   - Sử dụng state parameter để prevent CSRF
   - Validate redirect URIs

3. **API Rate Limits**
   - Google Calendar API: 1,000,000 queries/day/user
   - Implement rate limiting trong code

4. **User Permissions**
   - Chỉ user sở hữu task mới có thể tạo calendar event
   - Validate ownership trước khi tạo event

---

## Timeline Ước tính

| Phase | Thời gian | Mô tả |
|-------|-----------|-------|
| Phase 1 | 2-3 ngày | Setup và Database |
| Phase 2 | 3-4 ngày | OAuth Integration |
| Phase 3 | 4-5 ngày | Event Creation |
| Phase 4 | 3-4 ngày | Notification System |
| Phase 5 | 2-3 ngày | Error Handling |
| Phase 6 | 3-4 ngày | Testing |
| **Tổng** | **17-23 ngày** | ~3-4 tuần |

---

## Notes và Considerations

### 1. Timezone Handling
- Lưu timezone của user trong database
- Convert dueDate sang UTC trước khi lưu
- Google Calendar sẽ handle timezone automatically nếu set đúng

### 2. Multiple Calendars
- Hiện tại chỉ support primary calendar
- Có thể extend để user chọn calendar

### 3. Recurring Tasks
- Chưa support recurring tasks
- Có thể implement sau

### 4. Notification Preferences
- Hiện tại hardcode 2 notifications
- Có thể thêm settings để user customize

### 5. Offline/Background Jobs
- Cần Hangfire hoặc Quartz.NET cho background jobs
- Đảm bảo jobs chạy đúng lịch

### 6. ⚡ Server Không Cần Chạy Liên Tục để Gửi Thông Báo

**Câu trả lời: CÓ, thông báo vẫn hoạt động khi tắt server!**

**Giải thích chi tiết:**

#### Cách hoạt động:

1. **Khi Server CHẠY:**
   - User tạo/cập nhật task với `dueDate`
   - Server tạo/update event trong Google Calendar với reminders
   - Event được lưu trong Google Calendar của user
   - Server có thể tắt ngay sau đó

2. **Khi Server TẮT:**
   - Google Calendar (dịch vụ cloud của Google) vẫn hoạt động
   - Google Calendar tự động gửi thông báo theo reminders đã set:
     - **Reminder 1**: Vào 0h ngày đến hạn (email + popup)
     - **Reminder 2**: Đúng giờ phút của dueDate (email + popup)
   - User nhận thông báo qua email Google và popup trong Google Calendar app

#### Ưu điểm của cách tiếp cận này:

✅ **Không cần server chạy 24/7**: Tiết kiệm tài nguyên server  
✅ **Độ tin cậy cao**: Google Calendar có uptime 99.9%  
✅ **Không cần background jobs phức tạp**: Google tự động handle  
✅ **Hoạt động offline**: Thông báo vẫn đến dù server tắt

#### Server chỉ cần chạy khi:

- ✅ User tạo/cập nhật task → Tạo/update calendar event
- ✅ User xóa task → Xóa calendar event
- ✅ Sync lại các events (nếu cần)
- ✅ Background jobs chỉ cần để sync/create events ban đầu

#### Lưu ý:

⚠️ **Background jobs không cần thiết cho việc gửi notification**:  
- Background jobs chỉ cần để tạo/update events khi task được tạo/cập nhật
- Một khi event đã có trong Google Calendar, Google tự động gửi notifications
- Không cần scheduled job để "trigger" notifications

⚠️ **Hangfire/Quartz chỉ cần cho:**
- Sync tasks với calendar events (optional, có thể làm real-time)
- Cleanup orphaned events
- Retry failed event creation

---

## FAQ - Câu Hỏi Thường Gặp

### Q: Server tắt thì thông báo có hoạt động không?
**A: CÓ!** Google Calendar là dịch vụ cloud, tự động gửi thông báo mà không cần server của bạn chạy.

### Q: Server cần chạy khi nào?
**A:** Chỉ cần chạy khi:
- User tạo/cập nhật/xóa task (để tạo/update/delete calendar event)
- Sync events (optional)

### Q: Background jobs có cần thiết không?
**A:** Không bắt buộc cho việc gửi notification. Chỉ cần cho:
- Sync events khi cần
- Retry failed operations
- Cleanup

### Q: Nếu task được tạo khi server tắt thì sao?
**A:** Task sẽ được lưu trong database. Khi server chạy lại, có thể:
- Option 1: Tạo event ngay khi server start (scheduled job)
- Option 2: Tạo event khi user truy cập app và sync

---

## Status Tracking

### Checklist Tổng thể

- [x] Phase 1: Setup và Cấu hình ✅
- [x] Phase 2: Google OAuth Integration ✅
- [ ] Phase 3: Tự động tạo Calendar Event
- [ ] Phase 4: Notification System
- [ ] Phase 5: Error Handling và Retry Logic
- [ ] Phase 6: Testing

### Phase 1 Progress: ✅ **COMPLETED**

**Đã hoàn thành:**
- ✅ Tạo Models: `GoogleCalendarToken.cs`, `TaskCalendarEvent.cs`
- ✅ Thêm DbSet vào `TodoContext.cs`
- ✅ Tạo Migration: `AddGoogleCalendarTables`
- ✅ Cấu hình `appsettings.json` với Google Calendar config
- ✅ Thêm NuGet package: `Google.Apis.Calendar.v3`
- ✅ Tạo Setup Guide: `docs/Google_Calendar_Setup_Guide.md`

### Phase 2 Progress: ✅ **COMPLETED**

**Đã hoàn thành:**

**Backend:**
- ✅ Tạo `IGoogleCalendarService.cs` interface
- ✅ Tạo `GoogleCalendarService.cs` implementation
- ✅ Tạo `GoogleCalendarController.cs` với 4 endpoints:
  - GET `/api/google-calendar/auth-url` - Lấy OAuth authorization URL
  - GET `/api/google-calendar/callback` - Xử lý OAuth callback từ Google
  - GET `/api/google-calendar/status` - Kiểm tra trạng thái kết nối
  - DELETE `/api/google-calendar/disconnect` - Ngắt kết nối và xóa token
- ✅ Đăng ký service trong `Program.cs`

**Frontend:**
- ✅ Tạo `googleCalendarService.js` để gọi API
- ✅ Tạo `SettingsPage.jsx` với UI kết nối Google Calendar
- ✅ Thêm route `/settings` vào `App.jsx`

### Phase 3 Progress: ✅ **COMPLETED**

**Đã hoàn thành:**

**Backend:**
- ✅ Tạo `IGoogleCalendarEventService.cs` interface
- ✅ Tạo `GoogleCalendarEventService.cs` implementation với:
  - Tạo calendar event với reminders (2 lần: 1 ngày trước và đúng giờ)
  - Cập nhật event khi task được update
  - Xóa event khi task bị xóa
  - Sync task với calendar
- ✅ Tích hợp vào `TodoItemsController.cs`:
  - Tự động tạo event khi tạo task có dueDate
  - Tự động update/delete event khi update task
  - Tự động delete event khi delete task
- ✅ Đăng ký service trong `Program.cs`

**Next Step:** Phase 4 - Notification System

### Current Status: 🟢 **Phase 3 Completed - Ready for Testing**

---

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Hangfire Documentation](https://docs.hangfire.io/)

---

**Last Updated**: 2025-01-03
**Author**: Development Team
**Status**: 📝 Planning

