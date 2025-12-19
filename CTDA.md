
# File Tree: NEXUS-403

**Generated:** 12/11/2025, 9:23:04 PM

**Root Path:**`d:\NEXUS-403`

```

├── 📁 DACNGANH

│   └── 📝 GioiThieu_DeTai_MucTieu.md

├── 📁 TodoApi

│   ├── 📁 Controllers

│   │   ├── 📄 AdminController.cs

│   │   ├── 📄 AuthController.cs

│   │   ├── 📄 DashboardController.cs

│   │   ├── 📄 HealthController.cs

│   │   ├── 📄 MarketplaceController.cs

│   │   ├── 📄 ProjectsController.cs

│   │   ├── 📄 TodoItemsController.cs

│   │   ├── 📄 TodoListsController.cs

│   │   └── 📄 UserAppsController.cs

│   ├── 📁 Data

│   │   ├── 📁 MongoIdentity

│   │   │   ├── 📄 MongoRoleStore.cs

│   │   │   └── 📄 MongoUserStore.cs

│   │   └── 📄 MongoDbContext.cs

│   ├── 📁 Dtos

│   │   ├── 📄 AuthRequestDTO.cs

│   │   ├── 📄 AuthResponseDTO.cs

│   │   ├── 📄 CategoryDTO.cs

│   │   ├── 📄 CreateProjectDTO.cs

│   │   ├── 📄 CreateTodoItemDTO.cs

│   │   ├── 📄 CreateTodoListDTO.cs

│   │   ├── 📄 DashboardStatsDTO.cs

│   │   ├── 📄 MarketplaceAppDTO.cs

│   │   ├── 📄 ProjectDTO.cs

│   │   ├── 📄 PublishAppDTO.cs

│   │   ├── 📄 TodoItemDTO.cs

│   │   ├── 📄 TodoListDTO.cs

│   │   ├── 📄 UpdateItemStatusDTO.cs

│   │   └── 📄 UserAppDTO.cs

│   ├── 📁 Models

│   │   ├── 📁 MongoIdentity

│   │   │   ├── 📄 AppUser.cs

│   │   │   └── 📄 IdentityRole.cs

│   │   ├── 📄 AppUser.cs

│   │   ├── 📄 Category.cs

│   │   ├── 📄 Project.cs

│   │   ├── 📄 TodoItem.cs

│   │   ├── 📄 TodoList.cs

│   │   └── 📄 UserApp.cs

│   ├── 📁 Profiles

│   │   └── 📄 MappingProfile.cs

│   ├── 📁 Properties

│   │   └── ⚙️ launchSettings.json

│   ├── 📁 Repositories

│   ├── 📁 Scripts

│   │   └── 📝 MigrateToMongoDb.md

│   ├── 📁 Services

│   ├── ⚙️ .gitignore

│   ├── 📄 Program.cs

│   ├── 📄 TodoApi.csproj

│   ├── 📄 TodoApi.http

│   ├── ⚙️ appsettings.Development.json

│   ├── ⚙️ appsettings.json

│   ├── 📄 appsettings.json.example

│   ├── ⚙️ package-lock.json

│   └── ⚙️ package.json

├── 📁 doc2

│   ├── 📝 Canvas_Area_ComponentTypes_Analysis.md

│   ├── 📝 MyApp_Development_Plan.md

│   └── 📝 huongphattrien.md

├── 📁 docs

│   ├── 📁 fix bugs

│   │   ├── 📝 Fix_403_Access_Denied.md

│   │   ├── 📝 Fix_Add_Task_Error.md

│   │   ├── 📝 Fix_Publish_App_Callback_Error.md

│   │   ├── 📝 Fix_Redirect_URI_Mismatch.md

│   │   ├── 📝 Phase3_Quick_Test.md

│   │   ├── 📝 Phase3_Test_Checklist.md

│   │   └── 📝 Phase3_Testing_Guide.md

│   ├── 📝 Database_Architecture.md

│   ├── 📝 Event_System_Guide.md

│   ├── 📝 Google_OAuth_Setup.md

│   ├── 📝 How_to_View_MongoDB_Data.md

│   ├── 📝 Huong_dan_Tao_App_Notion.md

│   ├── 📝 MongoDB_Connection_Troubleshooting.md

│   ├── 📝 Multi_Tenant_Analysis.md

│   ├── 📝 Notion_TodoList_Design.md

│   ├── 📝 Notion_TodoList_Design_CheckReport.md

│   ├── 📝 Phase3_Testing_Guide.md

│   ├── 📝 Professional_Features_Prompts.md

│   ├── 📝 Refactoring_Summary.md

│   ├── 📝 TaskTable_ID_Info.md

│   ├── 📝 Testing_Checklist.md

│   ├── 📝 Toolbox _Items.md

│   ├── 🌐 privacy-policy-template.html

│   └── 📝 publish.md

├── 📁 todo-frontend

│   ├── 📁 src

│   │   ├── 📁 assets

│   │   │   └── 🖼️ react.svg

│   │   ├── 📁 components

│   │   │   ├── 📁 builder

│   │   │   │   ├── 📁 renders

│   │   │   │   │   ├── 📄 ControlRenders.jsx

│   │   │   │   │   ├── 📄 TaskBoardRender.jsx

│   │   │   │   │   ├── 📄 TaskCalendarRender.jsx

│   │   │   │   │   ├── 📄 TaskListRender.jsx

│   │   │   │   │   ├── 📄 TaskTableRender.jsx

│   │   │   │   │   └── 📄 index.js

│   │   │   │   ├── 📄 CanvasArea.jsx

│   │   │   │   ├── 📄 CanvasToolbar.jsx

│   │   │   │   ├── 📄 DraggableResizable.jsx

│   │   │   │   ├── 📄 DraggableTool.jsx

│   │   │   │   ├── 📄 PropertiesPanel.jsx

│   │   │   │   ├── 📄 RenderComponent.jsx

│   │   │   │   ├── 📄 Toolbox.jsx

│   │   │   │   └── 📄 gridConstants.js

│   │   │   ├── 📁 craft

│   │   │   ├── 📄 PageHeader.jsx

│   │   │   ├── 📄 Sidebar.jsx

│   │   │   └── 📄 Stats.jsx

│   │   ├── 📁 constants

│   │   │   └── 📄 toolboxItems.js

│   │   ├── 📁 contexts

│   │   │   └── 📄 SidebarContext.jsx

│   │   ├── 📁 hooks

│   │   │   ├── 📄 useAppBuilderHistory.js

│   │   │   ├── 📄 useDebounce.js

│   │   │   └── 📄 useTaskData.js

│   │   ├── 📁 pages

│   │   │   ├── 📄 AdminPage.jsx

│   │   │   ├── 📄 AppBuilderListPage.jsx

│   │   │   ├── 📄 AppBuilderPage.jsx

│   │   │   ├── 📄 AppRuntimePage.jsx

│   │   │   ├── 📄 DashboardPage.jsx

│   │   │   ├── 📄 LoginPage.jsx

│   │   │   ├── 📄 MarketplacePage.jsx

│   │   │   ├── 📄 MyAppPage.jsx

│   │   │   ├── 📄 RegisterPage.jsx

│   │   │   └── 📄 SettingsPage.jsx

│   │   ├── 📁 services

│   │   │   ├── 📄 apiService.js

│   │   │   └── 📄 googleCalendarService.js

│   │   ├── 📁 utils

│   │   │   ├── 📄 conditionEvaluator.js

│   │   │   ├── 📄 eventBus.js

│   │   │   ├── 📄 eventHandler.js

│   │   │   ├── 📄 getCategoryByType.js

│   │   │   └── 📄 jwtUtils.js

│   │   ├── 📄 App.jsx

│   │   ├── 🎨 index.css

│   │   └── 📄 main.jsx

│   ├── ⚙️ .gitignore

│   ├── 📝 README.md

│   ├── 📄 eslint.config.js

│   ├── 🌐 index.html

│   ├── ⚙️ package-lock.json

│   ├── ⚙️ package.json

│   ├── 📄 postcss.config.js

│   ├── 📄 tailwind.config.js

│   └── 📄 vite.config.js

├── 📝 CTDA.md

├── 📄 NEXUS-403.sln

└── 📝 SETUP.md

```

---

*Generated by FileTree Pro Extension*
