using MongoDB.Driver;
using TodoApi.Data;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Services
{
    /// <summary>
    /// Dịch vụ (Service) để chuyển dữ liệu hiện có sang kiến trúc đa người thuê (multi-tenant architecture)
    /// </summary>
    public class MultiTenantMigrationService
    {
        private readonly MongoDbContext _mongoContext;
        private readonly ILogger<MultiTenantMigrationService> _logger;

        public MultiTenantMigrationService(MongoDbContext mongoContext, ILogger<MultiTenantMigrationService> logger)
        {
            _mongoContext = mongoContext;
            _logger = logger;
        }

        /// <summary>
        /// Chạy quá trình migration để cập nhật dữ liệu hiện có với hỗ trợ multi-tenant
        /// Idempotent - có thể chạy nhiều lần một cách an toàn (safe to run multiple times)
        /// </summary>
        public async Task<MigrationResult> RunMigrationAsync()
        {
            var result = new MigrationResult
            {
                StartTime = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting multi-tenant migration...");

                // 1. Update existing TodoLists
                result.TodoListsUpdated = await UpdateTodoListsAsync();

                // 2. Update existing TodoItems
                result.TodoItemsUpdated = await UpdateTodoItemsAsync();

                // 3. Update existing UserApps
                result.UserAppsUpdated = await UpdateUserAppsAsync();

                // 4. Create indexes
                result.IndexesCreated = await CreateIndexesAsync();

                result.Success = true;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogInformation("Migration completed successfully. Duration: {Duration}ms", result.Duration.TotalMilliseconds);
                _logger.LogInformation("TodoLists updated: {Count}, TodoItems updated: {ItemCount}, UserApps updated: {AppCount}, Indexes created: {IndexCount}",
                    result.TodoListsUpdated, result.TodoItemsUpdated, result.UserAppsUpdated, result.IndexesCreated);

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogError(ex, "Migration failed after {Duration}ms", result.Duration.TotalMilliseconds);
                return result;
            }
        }

        /// <summary>
        /// Cập nhật các TodoLists hiện có: Đặt AppId = null (tương thích ngược - backward compatible)
        /// </summary>
        private async Task<int> UpdateTodoListsAsync()
        {
            try
            {
                _logger.LogInformation("Updating TodoLists...");

                // Tìm tất cả TodoLists có AppId null hoặc chưa có field AppId
                var filter = Builders<TodoList>.Filter.Or(
                    Builders<TodoList>.Filter.Eq(list => list.AppId, null),
                    Builders<TodoList>.Filter.Exists(list => list.AppId, false)
                );

                var count = await _mongoContext.TodoLists.CountDocumentsAsync(filter);

                if (count > 0)
                {
                    // Update: Set AppId = null (đảm bảo field tồn tại với giá trị null)
                    var update = Builders<TodoList>.Update.SetOnInsert(list => list.AppId, null);
                    var updateOptions = new UpdateOptions { IsUpsert = false };

                    // Sử dụng UpdateMany với Set để đảm bảo field tồn tại
                    var updateDefinition = Builders<TodoList>.Update.Set(list => list.AppId, (string?)null);
                    var updateResult = await _mongoContext.TodoLists.UpdateManyAsync(filter, updateDefinition);

                    _logger.LogInformation("Updated {Count} TodoLists", updateResult.ModifiedCount);
                    return (int)updateResult.ModifiedCount;
                }

                _logger.LogInformation("No TodoLists need updating");
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TodoLists");
                throw;
            }
        }

        /// <summary>
        /// Cập nhật các TodoItems hiện có: Đặt AppId = null (tương thích ngược - backward compatible)
        /// </summary>
        private async Task<int> UpdateTodoItemsAsync()
        {
            try
            {
                _logger.LogInformation("Updating TodoItems...");

                // Tìm tất cả TodoItems có AppId null hoặc chưa có field AppId
                var filter = Builders<TodoItem>.Filter.Or(
                    Builders<TodoItem>.Filter.Eq(item => item.AppId, null),
                    Builders<TodoItem>.Filter.Exists(item => item.AppId, false)
                );

                var count = await _mongoContext.TodoItems.CountDocumentsAsync(filter);

                if (count > 0)
                {
                    // Update: Set AppId = null
                    var updateDefinition = Builders<TodoItem>.Update.Set(item => item.AppId, (string?)null);
                    var updateResult = await _mongoContext.TodoItems.UpdateManyAsync(filter, updateDefinition);

                    _logger.LogInformation("Updated {Count} TodoItems", updateResult.ModifiedCount);
                    return (int)updateResult.ModifiedCount;
                }

                _logger.LogInformation("No TodoItems need updating");
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TodoItems");
                throw;
            }
        }

        /// <summary>
        /// Cập nhật các UserApps hiện có: Đặt TenantMode = "shared" và DatabaseName = null
        /// </summary>
        private async Task<int> UpdateUserAppsAsync()
        {
            try
            {
                _logger.LogInformation("Updating UserApps...");

                // Tìm tất cả UserApps cần update (TenantMode != "shared" hoặc DatabaseName != null)
                var filter = Builders<UserApp>.Filter.Or(
                    Builders<UserApp>.Filter.Ne(app => app.TenantMode, "shared"),
                    Builders<UserApp>.Filter.Exists(app => app.TenantMode, false),
                    Builders<UserApp>.Filter.Ne(app => app.DatabaseName, null),
                    Builders<UserApp>.Filter.Exists(app => app.DatabaseName, false)
                );

                var count = await _mongoContext.UserApps.CountDocumentsAsync(filter);

                if (count > 0)
                {
                    // Update: Set TenantMode = "shared" and DatabaseName = null
                    var updateDefinition = Builders<UserApp>.Update
                        .Set(app => app.TenantMode, "shared")
                        .Set(app => app.DatabaseName, (string?)null);

                    var updateResult = await _mongoContext.UserApps.UpdateManyAsync(filter, updateDefinition);

                    _logger.LogInformation("Updated {Count} UserApps", updateResult.ModifiedCount);
                    return (int)updateResult.ModifiedCount;
                }

                _logger.LogInformation("No UserApps need updating");
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating UserApps");
                throw;
            }
        }

        /// <summary>
        /// Tạo các indexes (chỉ mục) cho các collections multi-tenant
        /// Idempotent - có thể chạy nhiều lần một cách an toàn (safe to run multiple times)
        /// </summary>
        private async Task<int> CreateIndexesAsync()
        {
            try
            {
                _logger.LogInformation("Creating indexes...");
                int indexesCreated = 0;

                // Các indexes (chỉ mục) cho todoLists collection
                var todoListsCollection = _mongoContext.TodoLists;
                
                // Chỉ mục kết hợp (Compound index): (appUserId, appId)
                var todoListIndex1 = Builders<TodoList>.IndexKeys
                    .Ascending(list => list.AppUserId)
                    .Ascending(list => list.AppId);
                var todoListIndex1Options = new CreateIndexOptions { Name = "idx_appUserId_appId" };
                await todoListsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<TodoList>(todoListIndex1, todoListIndex1Options));
                indexesCreated++;
                _logger.LogInformation("Created index: todoLists.appUserId_appId");

                // Chỉ mục (Index): appId
                var todoListIndex2 = Builders<TodoList>.IndexKeys.Ascending(list => list.AppId);
                var todoListIndex2Options = new CreateIndexOptions { Name = "idx_appId" };
                await todoListsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<TodoList>(todoListIndex2, todoListIndex2Options));
                indexesCreated++;
                _logger.LogInformation("Created index: todoLists.appId");

                // Các indexes (chỉ mục) cho todoItems collection
                var todoItemsCollection = _mongoContext.TodoItems;

                // Chỉ mục kết hợp (Compound index): (appId, todoListId)
                var todoItemIndex1 = Builders<TodoItem>.IndexKeys
                    .Ascending(item => item.AppId)
                    .Ascending(item => item.TodoListId);
                var todoItemIndex1Options = new CreateIndexOptions { Name = "idx_appId_todoListId" };
                await todoItemsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<TodoItem>(todoItemIndex1, todoItemIndex1Options));
                indexesCreated++;
                _logger.LogInformation("Created index: todoItems.appId_todoListId");

                // Chỉ mục (Index): todoListId (có thể đã tồn tại, nhưng tạo lại để đảm bảo)
                var todoItemIndex2 = Builders<TodoItem>.IndexKeys.Ascending(item => item.TodoListId);
                var todoItemIndex2Options = new CreateIndexOptions { Name = "idx_todoListId" };
                await todoItemsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<TodoItem>(todoItemIndex2, todoItemIndex2Options));
                indexesCreated++;
                _logger.LogInformation("Created index: todoItems.todoListId");

                // Các indexes (chỉ mục) cho userApps collection
                var userAppsCollection = _mongoContext.UserApps;

                // Chỉ mục (Index): appUserId (có thể đã tồn tại)
                var userAppIndex1 = Builders<UserApp>.IndexKeys.Ascending(app => app.AppUserId);
                var userAppIndex1Options = new CreateIndexOptions { Name = "idx_appUserId" };
                await userAppsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<UserApp>(userAppIndex1, userAppIndex1Options));
                indexesCreated++;
                _logger.LogInformation("Created index: userApps.appUserId");

                // Chỉ mục (Index): tenantMode
                var userAppIndex2 = Builders<UserApp>.IndexKeys.Ascending(app => app.TenantMode);
                var userAppIndex2Options = new CreateIndexOptions { Name = "idx_tenantMode" };
                await userAppsCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<UserApp>(userAppIndex2, userAppIndex2Options));
                indexesCreated++;
                _logger.LogInformation("Created index: userApps.tenantMode");

                _logger.LogInformation("Created {Count} indexes", indexesCreated);
                return indexesCreated;
            }
            catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.CodeName == "IndexKeySpecsConflict")
            {
                // Index đã tồn tại, không phải lỗi
                _logger.LogWarning("Some indexes may already exist: {Message}", ex.Message);
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái (status) của quá trình migration
        /// </summary>
        public async Task<MigrationStatus> GetMigrationStatusAsync()
        {
            var status = new MigrationStatus();

            try
            {
                // Đếm TodoLists chưa có AppId
                var todoListFilter = Builders<TodoList>.Filter.Or(
                    Builders<TodoList>.Filter.Eq(list => list.AppId, null),
                    Builders<TodoList>.Filter.Exists(list => list.AppId, false)
                );
                status.TodoListsNeedingUpdate = (int)await _mongoContext.TodoLists.CountDocumentsAsync(todoListFilter);

                // Đếm TodoItems chưa có AppId
                var todoItemFilter = Builders<TodoItem>.Filter.Or(
                    Builders<TodoItem>.Filter.Eq(item => item.AppId, null),
                    Builders<TodoItem>.Filter.Exists(item => item.AppId, false)
                );
                status.TodoItemsNeedingUpdate = (int)await _mongoContext.TodoItems.CountDocumentsAsync(todoItemFilter);

                // Đếm UserApps cần update
                var userAppFilter = Builders<UserApp>.Filter.Or(
                    Builders<UserApp>.Filter.Ne(app => app.TenantMode, "shared"),
                    Builders<UserApp>.Filter.Exists(app => app.TenantMode, false),
                    Builders<UserApp>.Filter.Ne(app => app.DatabaseName, null),
                    Builders<UserApp>.Filter.Exists(app => app.DatabaseName, false)
                );
                status.UserAppsNeedingUpdate = (int)await _mongoContext.UserApps.CountDocumentsAsync(userAppFilter);

                // Kiểm tra indexes
                var todoListIndexes = await _mongoContext.TodoLists.Indexes.ListAsync();
                var todoItemIndexes = await _mongoContext.TodoItems.Indexes.ListAsync();
                var userAppIndexes = await _mongoContext.UserApps.Indexes.ListAsync();

                status.IndexesExist = (await todoListIndexes.ToListAsync()).Count > 1 && // > 1 vì có _id index
                                     (await todoItemIndexes.ToListAsync()).Count > 1 &&
                                     (await userAppIndexes.ToListAsync()).Count > 1;

                status.IsMigrationNeeded = status.TodoListsNeedingUpdate > 0 ||
                                          status.TodoItemsNeedingUpdate > 0 ||
                                          status.UserAppsNeedingUpdate > 0 ||
                                          !status.IndexesExist;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking migration status");
                status.ErrorMessage = ex.Message;
            }

            return status;
        }
    }

    /// <summary>
    /// Kết quả của quá trình migration (chuyển dữ liệu)
    /// </summary>
    public class MigrationResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
        public int TodoListsUpdated { get; set; }
        public int TodoItemsUpdated { get; set; }
        public int UserAppsUpdated { get; set; }
        public int IndexesCreated { get; set; }
    }

    /// <summary>
    /// Trạng thái (Status) của quá trình migration
    /// </summary>
    public class MigrationStatus
    {
        public bool IsMigrationNeeded { get; set; }
        public int TodoListsNeedingUpdate { get; set; }
        public int TodoItemsNeedingUpdate { get; set; }
        public int UserAppsNeedingUpdate { get; set; }
        public bool IndexesExist { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
