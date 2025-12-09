
# File Tree: NEXUS-403

**Generated:** 12/9/2025, 8:25:31 AM

**Root Path:**`d:\NEXUS-403`

```

├── 📁 TodoApi

│   ├── 📁 AI

│   │   ├── 📁 Models

│   │   │   ├── 📄 TaskInput.cs

│   │   │   └── 📄 TaskPriorityPrediction.cs

│   │   ├── 📄 AiModelService.cs

│   │   ├── 📄 AiPredictionService.cs

│   │   └── 📄 task-data.csv

│   ├── 📁 Controllers

│   │   ├── 📄 AdminController.cs

│   │   ├── 📄 AiController.cs

│   │   ├── 📄 AuthController.cs

│   │   ├── 📄 DashboardController.cs

│   │   ├── 📄 GoogleCalendarController.cs

│   │   ├── 📄 MarketplaceController.cs

│   │   ├── 📄 ProjectsController.cs

│   │   ├── 📄 TodoItemsController.cs

│   │   ├── 📄 TodoListsController.cs

│   │   └── 📄 UserAppsController.cs

│   ├── 📁 Data

│   │   └── 📄 TodoContext.cs

│   ├── 📁 Dtos

│   │   ├── 📄 AuthRequestDTO.cs

│   │   ├── 📄 AuthResponseDTO.cs

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

│   ├── 📁 Migrations

│   │   ├── 📄 20251104150320_InitialCreate.Designer.cs

│   │   ├── 📄 20251104150320_InitialCreate.cs

│   │   ├── 📄 20251104152646_AddPriorityAndDueDateToItems.Designer.cs

│   │   ├── 📄 20251104152646_AddPriorityAndDueDateToItems.cs

│   │   ├── 📄 20251104153901_AddTodoListRelationships.Designer.cs

│   │   ├── 📄 20251104153901_AddTodoListRelationships.cs

│   │   ├── 📄 20251104161018_AddIdentitySupport.Designer.cs

│   │   ├── 📄 20251104161018_AddIdentitySupport.cs

│   │   ├── 📄 20251104162240_AddUserTodoListRelationship.Designer.cs

│   │   ├── 📄 20251104162240_AddUserTodoListRelationship.cs

│   │   ├── 📄 20251113162459_ReplacedIsDoneWithStatus.Designer.cs

│   │   ├── 📄 20251113162459_ReplacedIsDoneWithStatus.cs

│   │   ├── 📄 20251127113459_AddProjectsTable.Designer.cs

│   │   ├── 📄 20251127113459_AddProjectsTable.cs

│   │   ├── 📄 20251203105024_AddGoogleCalendarTables.Designer.cs

│   │   ├── 📄 20251203105024_AddGoogleCalendarTables.cs

│   │   ├── 📄 20251203105510_AddUniqueConstraintsToGoogleCalendarTables.Designer.cs

│   │   ├── 📄 20251203105510_AddUniqueConstraintsToGoogleCalendarTables.cs

│   │   ├── 📄 20251205124347_AddUserApps.Designer.cs

│   │   ├── 📄 20251205124347_AddUserApps.cs

│   │   └── 📄 TodoContextModelSnapshot.cs

│   ├── 📁 Models

│   │   ├── 📄 AppUser.cs

│   │   ├── 📄 GoogleCalendarToken.cs

│   │   ├── 📄 Project.cs

│   │   ├── 📄 TaskCalendarEvent.cs

│   │   ├── 📄 TodoItem.cs

│   │   ├── 📄 TodoList.cs

│   │   └── 📄 UserApp.cs

│   ├── 📁 Profiles

│   │   └── 📄 MappingProfile.cs

│   ├── 📁 Properties

│   │   └── ⚙️ launchSettings.json

│   ├── 📁 Repositories

│   ├── 📁 Services

│   │   ├── 📄 GoogleCalendarEventService.cs

│   │   ├── 📄 GoogleCalendarService.cs

│   │   ├── 📄 IGoogleCalendarEventService.cs

│   │   └── 📄 IGoogleCalendarService.cs

│   ├── ⚙️ .gitignore

│   ├── 📄 Program.cs

│   ├── 📄 TodoApi.csproj

│   ├── 📄 TodoApi.http

│   ├── ⚙️ appsettings.Development.json

│   ├── ⚙️ appsettings.json

│   ├── ⚙️ package-lock.json

│   └── ⚙️ package.json

├── 📁 doc2

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

│   ├── 📝 CTDA.md

│   ├── 📝 Event_System_Guide.md

│   ├── 📝 Huong_dan_Tao_App_Notion.md

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

│   │   │   │   ├── 📄 DraggableTool.jsx

│   │   │   │   ├── 📄 PropertiesPanel.jsx

│   │   │   │   ├── 📄 RenderComponent.jsx

│   │   │   │   └── 📄 Toolbox.jsx

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

│   │   │   ├── 📄 CalendarPage.jsx

│   │   │   ├── 🎨 CalendarStyles.css

│   │   │   ├── 📄 DashboardPage.jsx

│   │   │   ├── 📄 KanbanPage.jsx

│   │   │   ├── 📄 ListDetailPage.jsx

│   │   │   ├── 📄 LoginPage.jsx

│   │   │   ├── 📄 MarketplacePage.jsx

│   │   │   ├── 📄 MyAppPage.jsx

│   │   │   ├── 📄 RegisterPage.jsx

│   │   │   ├── 📄 SettingsPage.jsx

│   │   │   └── 📄 TodoList.jsx

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

└── 📄 NEXUS-403.sln

```

---

*Generated by FileTree Pro Extension*
