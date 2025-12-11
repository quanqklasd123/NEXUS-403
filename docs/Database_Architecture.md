# Kiến trúc Database - SQL Server vs MongoDB Atlas

## Tổng quan

Dự án sử dụng **2 database** cho các mục đích khác nhau:

### 1. SQL Server - Lưu trữ User & Admin Accounts

**Database:** `TodoDb` (trên SQL Server local)

**Dữ liệu lưu trữ:**
- ✅ **User accounts** (AppUser) - Email, Username, PasswordHash
- ✅ **Admin accounts** - Roles và permissions
- ✅ **Identity tables** - AspNetUsers, AspNetRoles, AspNetUserRoles, etc.
- ✅ **Authentication tokens** - JWT tokens (được generate, không lưu trong DB)

**Cấu hình:**
- Connection String: `Server=LAPTOP-SPLCTDRT;Database=TodoDb;...`
- Sử dụng: **ASP.NET Core Identity**
- Framework: **Entity Framework Core**

**Lý do:**
- Identity framework của .NET được thiết kế tốt cho SQL Server
- Hỗ trợ đầy đủ các tính năng: Roles, Claims, Lockout, 2FA
- Migration và seeding dễ dàng

### 2. MongoDB Atlas - Lưu trữ Business Data

**Database:** `NexusDb` (trên MongoDB Atlas cloud)

**Dữ liệu lưu trữ:**
- ✅ **Projects** - App builder projects
- ✅ **TodoLists** - Todo lists của users
- ✅ **TodoItems** - Todo items/tasks
- ✅ **UserApps** - Apps được tạo/download
- ✅ **GoogleCalendarTokens** - Google Calendar integration tokens
- ✅ **TaskCalendarEvents** - Calendar events mapping

**Cấu hình:**
- Connection String: `mongodb+srv://...@nexus-cluster.p8uzm5c.mongodb.net/`
- Sử dụng: **MongoDB.Driver**
- Framework: **Native MongoDB Driver**

**Lý do:**
- Tiết kiệm dung lượng máy local
- Scalable và flexible schema
- Dễ mở rộng trong tương lai

## Kiến trúc kết nối

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         │ HTTP/API
         │
┌────────▼─────────────────────────────┐
│         Backend (ASP.NET Core)       │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  Identity (Authentication)   │  │
│  │  └─► SQL Server (TodoDb)     │  │
│  │      - Users                  │  │
│  │      - Roles                  │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  Business Logic              │  │
│  │  └─► MongoDB Atlas (NexusDb) │  │
│  │      - Projects               │  │
│  │      - TodoLists              │  │
│  │      - TodoItems              │  │
│  │      - UserApps               │  │
│  └──────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Quan hệ giữa 2 databases

- **AppUserId** trong MongoDB collections là **string ID** từ SQL Server `AspNetUsers` table
- Khi cần thông tin user (username, email), phải query từ SQL Server
- Khi cần business data, query từ MongoDB

## Lưu ý

- **User accounts KHÔNG được migrate** sang MongoDB
- Chỉ **business data** được migrate
- Cả 2 databases đều cần hoạt động để app chạy đầy đủ

