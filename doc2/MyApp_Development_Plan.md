# 📱 MY APP - Kế Hoạch Phát Triển Chi Tiết

## 🎯 Tổng Quan Dự Án

Xây dựng hệ thống **My App** - nơi người dùng quản lý và sử dụng các app của mình.

### 📦 Nguồn gốc App trong My App:

| Nguồn | Mô tả |
|-------|-------|
| 🛠️ **Tự tạo** | User tạo app từ App Builder, sau đó save vào My App |
| 📥 **Tải về** | User download app từ Marketplace về My App |

```
┌─────────────────────────────────────────────────────────────┐
│                      LUỒNG APP                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                    ┌─────────────┐        │
│   │ App Builder │───── Save ────────▶│             │        │
│   │ (Tự tạo)    │                    │   MY APP    │        │
│   └─────────────┘                    │  (Quản lý)  │        │
│                                      │             │        │
│   ┌─────────────┐                    │   • Open    │        │
│   │ Marketplace │───── Download ────▶│   • Edit    │        │
│   │ (Tải về)    │                    │   • Delete  │        │
│   └─────────────┘                    └─────────────┘        │
│                                             │               │
│                                             ▼               │
│                                      ┌─────────────┐        │
│                                      │ App Runtime │        │
│                                      │ (Sử dụng)   │        │
│                                      └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Mục tiêu:
1. User có thể **tạo app** từ App Builder → Save vào My App
2. User có thể **tải app** từ Marketplace → Thêm vào My App  
3. User có thể **sử dụng app** bằng cách click vào card trong My App

---

## 📋 Các Giai Đoạn Phát Triển

### 🔵 PHASE 1: Di chuyển App Builder sang Sidebar ✅ COMPLETED
**Mục tiêu:** Tách App Builder ra khỏi Dashboard, đặt vào Sidebar chính

```
TRƯỚC:                              SAU:
┌─────────────────────┐            ┌─────────────────────┐
│ Dashboard           │            │ Dashboard           │
│  ├── My Tasks       │            │  ├── My Tasks       │
│  ├── App Builder ❌ │            │  └── My App ✨      │
│  └── ...            │            │                     │
└─────────────────────┘            │ App Builder ✨      │
                                   │  (Sidebar riêng)    │
                                   └─────────────────────┘
```

**Tasks:**
- [x] Thêm route `/app-builder` vào Router
- [x] Thêm route `/app-builder/:appId` để edit app
- [x] Thêm menu "App Builder" vào Sidebar chính (với icon FiLayers)
- [x] AppBuilderPage hoạt động độc lập (không cần projectId)
- [x] Cập nhật navigation links

---

### 🟢 PHASE 2: Xây dựng trang My App trong Dashboard
**Mục tiêu:** Tạo giao diện quản lý các app của user dưới dạng **Interactive App Cards**

### 🎴 App Card là gì?

App Card **KHÔNG phải** card tĩnh thông thường, mà là **Mini App có thể tương tác**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         MY APP                                   │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [All] [Created] [Downloaded]                           │
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │ 📋 My Tasks       │  │ ⏰ Simple Clock   │                   │
│  │ ─────────────────│  │ ─────────────────│                   │
│  │ ┌───────────────┐ │  │                   │                   │
│  │ │☐ Task 1      │ │  │     14:35:28      │  ← Mini Preview   │
│  │ │☑ Task 2      │ │  │                   │    có thể tương   │
│  │ │☐ Task 3      │ │  │  Thu, Dec 5       │    tác ngay!      │
│  │ └───────────────┘ │  │                   │                   │
│  │ ─────────────────│  │ ─────────────────│                   │
│  │ 🛠️ Created        │  │ 📥 Downloaded     │                   │
│  │ [⤢ Open] [✎ Edit]│  │ [⤢ Open] [🗑 Del] │                   │
│  └───────────────────┘  └───────────────────┘                   │
│         │                        │                              │
│         │ Click "Open"           │ Click "Open"                 │
│         ▼                        ▼                              │
│  ┌─────────────────────────────────────────┐                    │
│  │         FULL APP PAGE (Runtime)         │                    │
│  │   Giống hệt Preview trong App Builder   │                    │
│  │   Nhưng là trang riêng, full screen     │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 Interaction Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                     APP CARD INTERACTIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   APP CARD      │                                            │
│  │  (Mini Preview) │                                            │
│  │                 │                                            │
│  │  ☐ Task 1       │◄───── User có thể TƯƠNG TÁC ngay          │
│  │  ☑ Task 2       │       trong card (check/uncheck, etc.)    │
│  │  ☐ Task 3       │                                            │
│  │                 │                                            │
│  │ [Open] [Edit]   │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│     Click │ "Open"                                              │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FULL APP PAGE (/my-app/:appId)              │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  ← Back    📋 My Tasks                          │    │   │
│  │  ├─────────────────────────────────────────────────┤    │   │
│  │  │  🔍 Search...   [Filter ▼] [Sort ▼] [+ Add]    │    │   │
│  │  ├─────────────────────────────────────────────────┤    │   │
│  │  │  ☐ Task 1 - High - Due Today                   │    │   │
│  │  │  ☑ Task 2 - Medium - Done                      │    │   │
│  │  │  ☐ Task 3 - Low - Due Tomorrow                 │    │   │
│  │  │  ...                                           │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  (Giống hệt Preview của App Builder - Full functionality)│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 📋 App Card Components:

| Phần | Mô tả |
|------|-------|
| **Header** | Icon + Tên app |
| **Mini Preview** | Render components thu nhỏ, **có thể tương tác** |
| **Footer** | Source badge + Action buttons |

**Actions theo Source:**
- 🛠️ **Created**: `[Open]` `[Edit]` `[Delete]`
- 📥 **Downloaded**: `[Open]` `[Delete]` (không Edit được)

**Tasks:** ✅ COMPLETED
- [x] Tạo component `MyAppPage.jsx`
- [x] Tạo component `AppCard.jsx` - **Interactive** card với mini preview
- [x] Tạo component `MiniAppRenderer.jsx` - Render thu nhỏ của app trong card
- [x] Tạo `userAppService.js` - Frontend service
- [x] Thêm route `/my-apps` và link trong Sidebar
- [x] Tạo `UserApp.cs` Model (Backend)
- [x] Tạo `UserAppDTO.cs` DTOs (Backend)
- [x] Tạo `UserAppsController.cs` API endpoints (Backend)
- [x] Cập nhật `TodoContext.cs` với DbSet<UserApp>

---

### 🟡 PHASE 3: Trang App Runtime (Full App Page)
**Mục tiêu:** Khi click "Open" trên App Card → Mở trang full app (giống Preview của App Builder)

### 🔗 So sánh App Card vs App Runtime:

```
┌─────────────────────────────────────────────────────────────────┐
│              APP CARD (Mini)    vs    APP RUNTIME (Full)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐           ┌─────────────────────────────┐  │
│  │ 📋 My Tasks     │           │ ← Back        📋 My Tasks   │  │
│  │ ───────────────│           ├─────────────────────────────┤  │
│  │ ☐ Task 1       │   Click   │ 🔍 Search  [Filter] [+ Add] │  │
│  │ ☑ Task 2       │  ──────▶  ├─────────────────────────────┤  │
│  │ ☐ Task 3       │   Open    │ ☐ Task 1 - High - Today     │  │
│  │ ───────────────│           │ ☑ Task 2 - Medium - Done    │  │
│  │ [Open] [Edit]  │           │ ☐ Task 3 - Low - Tomorrow   │  │
│  └─────────────────┘           │ ☐ Task 4 - High - Next Week│  │
│                                │ ...more tasks...            │  │
│   Size: ~300x400px             └─────────────────────────────┘  │
│   Scrollable: Limited                                           │
│   Components: Scaled down       Size: Full screen               │
│                                 Scrollable: Yes                 │
│                                 Components: Full size           │
│                                 Features: ALL enabled           │
└─────────────────────────────────────────────────────────────────┘
```

### 🖥️ App Runtime Page Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME HEADER                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ← Back to My App    📋 My Tasks           [⚙️] [Share]   │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  RUNTIME CONTENT (= App Builder Preview)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   Render CHÍNH XÁC như Preview trong App Builder          │  │
│  │   - Cùng components                                       │  │
│  │   - Cùng layout                                           │  │
│  │   - Cùng functionality                                    │  │
│  │   - Nhưng kết nối với REAL DATA (database)               │  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────┐     │  │
│  │   │ DatabaseTitle: "My Tasks"                       │     │  │
│  │   ├─────────────────────────────────────────────────┤     │  │
│  │   │ [Table][List][Board][Calendar] 🔍 [Filter][+]   │     │  │
│  │   ├─────────────────────────────────────────────────┤     │  │
│  │   │ TITLE      STATUS      PRIORITY    DUE DATE    │     │  │
│  │   │ ─────────────────────────────────────────────── │     │  │
│  │   │ Task 1     Todo        High        Dec 5       │     │  │
│  │   │ Task 2     Done        Medium      Dec 4       │     │  │
│  │   │ Task 3     InProgress  Low         Dec 6       │     │  │
│  │   └─────────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### ⚡ Key Points:

| Aspect | App Card (Mini) | App Runtime (Full) |
|--------|-----------------|-------------------|
| **Size** | ~300x400px card | Full screen |
| **Data** | Simplified/Limited | Full data |
| **Interaction** | Basic (click, check) | Full functionality |
| **URL** | `/dashboard/my-app` | `/app/:appId` |
| **Components** | Scaled down | Original size |

**Tasks:**
- [ ] Tạo route `/app/:appId` 
- [ ] Tạo component `AppRuntimePage.jsx`
- [ ] Tạo `RuntimeRenderer.jsx` - render app từ config (reuse từ Preview)
- [ ] Tạo `RuntimeHeader.jsx` - Back button, app name, settings
- [ ] Kết nối với API thực (không dùng mock data)
- [ ] Implement event system cho runtime
- [ ] Data persistence - lưu thay đổi vào database

---

### 🟠 PHASE 4: App Templates - TodoList Notion Style
**Mục tiêu:** Tạo sẵn template TodoList như Notion

**App Config Structure:**
```json
{
  "id": "todolist-notion",
  "name": "TodoList Notion Style",
  "icon": "📋",
  "description": "A Notion-style task manager",
  "components": [
    {
      "id": "header-1",
      "type": "databaseTitle",
      "props": { "title": "My Tasks" }
    },
    {
      "id": "toolbar-1", 
      "type": "container",
      "props": { "direction": "row" },
      "children": [
        { "type": "viewSwitcher", "props": {...} },
        { "type": "searchBox", "props": {...} },
        { "type": "sortDropdown", "props": {...} },
        { "type": "filterBar", "props": {...} },
        { "type": "addTaskButton", "props": {...} }
      ]
    },
    {
      "id": "content-1",
      "type": "taskTable",
      "props": {
        "columns": ["title", "status", "priority", "dueDate"],
        "allowEdit": true,
        "allowDelete": true
      }
    }
  ]
}
```

**Tasks:**
- [ ] Tạo file `appTemplates.js` chứa các template
- [ ] Implement TodoList template
- [ ] Tạo UI chọn template khi tạo app mới
- [ ] Hỗ trợ clone template thành user app

---

### 🔴 PHASE 5: App Templates - Simple Clock
**Mục tiêu:** Tạo app đồng hồ đơn giản

```
┌─────────────────────────────────┐
│         ⏰ Simple Clock         │
├─────────────────────────────────┤
│                                 │
│           14:35:28              │
│                                 │
│     Thursday, Dec 5, 2025       │
│                                 │
│  [Digital] [Analog] [Timezone]  │
│                                 │
└─────────────────────────────────┘
```

**Tasks:**
- [ ] Tạo component `ClockRender.jsx`
- [ ] Tạo component `AnalogClockRender.jsx`
- [ ] Tạo component `DateDisplayRender.jsx`
- [ ] Thêm vào toolboxItems.js
- [ ] Tạo Clock template

---

## 🗂️ Cấu Trúc Files Mới

```
src/
├── pages/
│   ├── AppBuilderPage.jsx      # (đã có) - Di chuyển ra sidebar
│   ├── MyAppPage.jsx           # ✨ NEW - Quản lý apps với interactive cards
│   └── AppRuntimePage.jsx      # ✨ NEW - Full app page (giống Preview)
│
├── components/
│   ├── myapp/
│   │   ├── AppCard.jsx         # ✨ Interactive card với mini preview
│   │   ├── MiniAppRenderer.jsx # ✨ Render app thu nhỏ trong card
│   │   └── AppGrid.jsx         # ✨ Grid layout cho cards
│   │
│   ├── runtime/
│   │   ├── RuntimeRenderer.jsx # ✨ Render full app (reuse từ builder)
│   │   └── RuntimeHeader.jsx   # ✨ Header với Back, app name
│   │
│   └── builder/
│       └── renders/            # (đã có) - Reuse cho cả Card và Runtime
│           ├── TaskTableRender.jsx
│           ├── TaskListRender.jsx
│           ├── ControlRenders.jsx
│           ├── ClockRender.jsx      # ✨ Digital clock
│           ├── AnalogClockRender.jsx # ✨ Analog clock
│           └── DateDisplayRender.jsx # ✨ Date display
│
├── constants/
│   └── appTemplates.js         # ✨ App templates (TodoList, Clock)
│
├── services/
│   └── userAppService.js       # ✨ API cho user apps
│
└── store/
    └── userAppStore.js         # ✨ State management
```

---

## 🔌 API Endpoints Cần Tạo

### Backend (TodoApi)

```csharp
// UserAppsController.cs

GET    /api/userapps              // Lấy tất cả apps của user
GET    /api/userapps/{id}         // Lấy config của 1 app
POST   /api/userapps              // Tạo app mới (từ App Builder)
POST   /api/userapps/download/{marketplaceAppId}  // Tải app từ Marketplace
PUT    /api/userapps/{id}         // Update app config (chỉ với source='created')
DELETE /api/userapps/{id}         // Xóa app
```

### Database Schema

```sql
CREATE TABLE UserApps (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT FOREIGN KEY,
    Name NVARCHAR(255),
    Icon NVARCHAR(50),
    Description NVARCHAR(500),
    Config NVARCHAR(MAX),  -- JSON config của app
    Source NVARCHAR(20),   -- 'created' | 'downloaded'
    MarketplaceAppId INT NULL,  -- ID app gốc từ Marketplace (nếu downloaded)
    OriginalAuthor NVARCHAR(255) NULL, -- Tác giả gốc (nếu downloaded)
    CreatedAt DATETIME,
    UpdatedAt DATETIME
);
```

**Giải thích Source:**
- `created`: User tự tạo từ App Builder → Có thể Edit, Delete
- `downloaded`: User tải từ Marketplace → Chỉ có thể Open, Delete (không Edit)

---

## 🎨 UI/UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │     SIDEBAR     │
                    └─────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ App Builder │     │  Dashboard  │     │ Marketplace │
│ (Tạo app)   │     │   My App    │     │ (Tải app)   │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        │                   │                   │
        │    ┌──────────────┼──────────────┐    │
        │    │              │              │    │
        ▼    ▼              ▼              ▼    ▼
        ┌─────────────────────────────────────────┐
        │              USER'S MY APP              │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
        │  │🛠️Created│ │🛠️Created│ │📥Downloaded│ │
        │  │ TodoList│ │  Clock  │ │  Budget  │   │
        │  └─────────┘ └─────────┘ └─────────┘   │
        └─────────────────────────────────────────┘
                            │
                      [Click Open]
                            │
                            ▼
                    ┌─────────────┐
                    │ App Runtime │
                    │ (Sử dụng)   │
                    └─────────────┘

FLOW 1: Tạo App
───────────────
App Builder → Save → My App (source: 'created')

FLOW 2: Tải App
───────────────
Marketplace → Download → My App (source: 'downloaded')

FLOW 3: Sử dụng App
───────────────────
My App → Click Card → App Runtime
```

---

## 📝 PROMPTS CHO TỪNG PHASE

### 🔵 PROMPT PHASE 1: Di chuyển App Builder

```
Hãy thực hiện các bước sau:

1. Thêm route mới `/app-builder` vào file Router (App.jsx hoặc routes config)

2. Cập nhật Sidebar chính (không phải sidebar của dashboard) để thêm menu item:
   - Icon: 🛠️ hoặc icon phù hợp
   - Label: "App Builder"
   - Link: /app-builder

3. Xóa App Builder khỏi Dashboard navigation

4. Đảm bảo AppBuilderPage hoạt động độc lập tại route mới

5. Test navigation từ sidebar đến App Builder
```

---

### 🟢 PROMPT PHASE 2: Trang My App với Interactive Cards

```
Hãy tạo trang My App trong Dashboard với các yêu cầu:

1. Tạo file `src/pages/MyAppPage.jsx`:
   - Hiển thị grid các Interactive App Cards
   - Filter tabs: [All] [Created] [Downloaded]
   - Loading state và empty state
   - Nút "Go to App Builder" và "Go to Marketplace"

2. Tạo file `src/components/myapp/AppCard.jsx`:
   - **QUAN TRỌNG**: Card phải có MINI PREVIEW có thể tương tác
   - Layout:
     - Header: Icon + App name
     - Body: MiniAppRenderer (render thu nhỏ của app)
     - Footer: Source badge + Action buttons
   - Source badge: 🛠️ Created hoặc 📥 Downloaded
   - Buttons tùy theo source:
     - Created: [Open] [Edit] [Delete]
     - Downloaded: [Open] [Delete]
   - Click "Open" → Navigate to /app/:appId

3. Tạo file `src/components/myapp/MiniAppRenderer.jsx`:
   - Render app components trong card (scaled down)
   - Cho phép tương tác cơ bản (click checkbox, etc.)
   - Giới hạn chiều cao, có scroll nếu cần
   - Reuse các render components từ builder/renders/

4. Tạo service `src/services/userAppService.js`:
   - getUserApps(filter?) - filter: 'all' | 'created' | 'downloaded'
   - getAppById(id)
   - createApp(data) - khi save từ App Builder
   - downloadApp(marketplaceAppId) - khi tải từ Marketplace
   - updateApp(id, data) - chỉ cho source='created'
   - deleteApp(id)

5. Thêm route `/dashboard/my-app` và link trong Dashboard sidebar
```

---

### 🟡 PROMPT PHASE 3: App Runtime (Full App Page)

```
Hãy tạo trang App Runtime - trang full app khi click "Open" từ App Card:

1. Tạo file `src/pages/AppRuntimePage.jsx`:
   - Route: /app/:appId
   - Load app config từ API
   - Full screen app view
   - **GIỐNG HỆT Preview của App Builder**

2. Tạo file `src/components/runtime/RuntimeRenderer.jsx`:
   - Nhận app config (JSON)
   - Render components CHÍNH XÁC như Preview trong App Builder
   - Reuse render components từ builder/renders/
   - Xử lý nested components (children)
   - Kết nối với REAL API (không mock data)

3. Tạo file `src/components/runtime/RuntimeHeader.jsx`:
   - Back button → Navigate về /dashboard/my-app
   - App icon và name
   - Optional: Settings, Share buttons

4. Khác biệt với App Builder Preview:
   - KHÔNG có drag-drop editing
   - KHÔNG có properties panel
   - CHỈ có app content (như end-user sử dụng)
   - Data được lưu vào database thực

5. Đảm bảo:
   - Event system hoạt động (filter, search, sort)
   - Data persistence (thay đổi được lưu vào DB)
   - Responsive design
   - Loading states
```

---

### 🟠 PROMPT PHASE 4: TodoList Template

```
Hãy tạo TodoList template giống Notion:

1. Tạo file `src/constants/appTemplates.js`:
   - Export array các templates
   - Mỗi template có: id, name, icon, description, config

2. Tạo TodoList Notion template với config:
   - DatabaseTitle component
   - Toolbar với: ViewSwitcher, SearchBox, SortDropdown, FilterBar, AddTaskButton
   - TaskTable/TaskList/TaskBoard (switchable views)
   - Tất cả đều là components, KHÔNG hardcode

3. Cập nhật CreateAppModal để hiển thị templates

4. Implement clone template:
   - Copy config từ template
   - Tạo user app mới với config đó

5. Test: User chọn TodoList template → App được tạo → Open app → Sử dụng như Notion
```

---

### 🔴 PROMPT PHASE 5: Clock App

```
Hãy tạo Clock App components và template:

1. Thêm vào toolboxItems.js (category: "Utility"):
   - digitalClock: Đồng hồ số
   - analogClock: Đồng hồ kim
   - dateDisplay: Hiển thị ngày
   - timezoneSelector: Chọn timezone

2. Tạo render components:
   - `renders/ClockRenders.jsx`:
     - DigitalClockRender: Hiển thị giờ:phút:giây
     - AnalogClockRender: Đồng hồ kim SVG
     - DateDisplayRender: Ngày tháng năm
     - TimezoneSelectorRender: Dropdown timezone

3. Cập nhật RenderComponent.jsx và PropertiesPanel.jsx

4. Tạo Clock template trong appTemplates.js:
   - Title: "Simple Clock"
   - DigitalClock (lớn, center)
   - DateDisplay (dưới clock)
   - TimezoneSelector (optional)

5. Properties cho clock:
   - format: 12h / 24h
   - showSeconds: true/false
   - timezone: UTC, local, custom
   - theme: light/dark
```

---

## ✅ Checklist Tổng Quan

### Phase 1: Di chuyển App Builder
- [ ] Route `/app-builder` 
- [ ] Sidebar menu item
- [ ] Remove từ Dashboard

### Phase 2: My App Page
- [ ] MyAppPage component
- [ ] AppCard component
- [ ] CreateAppModal
- [ ] userAppService
- [ ] Dashboard integration

### Phase 3: App Runtime
- [ ] AppRuntimePage
- [ ] RuntimeRenderer
- [ ] Event system
- [ ] API integration

### Phase 4: TodoList Template
- [ ] appTemplates.js
- [ ] TodoList config
- [ ] Template selection UI
- [ ] Clone functionality

### Phase 5: Clock App
- [ ] Clock components
- [ ] Clock renders
- [ ] Clock template
- [ ] Properties panel

---

## 🚀 Bắt Đầu

Để bắt đầu, hãy chạy prompt của **Phase 1** trước. Sau khi hoàn thành mỗi phase, test kỹ trước khi chuyển sang phase tiếp theo.

**Thứ tự ưu tiên:**
1. Phase 1 → Phase 2 → Phase 3 (Core infrastructure)
2. Phase 4 (TodoList - app chính)
3. Phase 5 (Clock - app phụ)

---

*Tài liệu được tạo: 5/12/2025*
*Dự án: NEXUS-403 - My App System*
