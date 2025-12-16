using MongoDB.Driver;
using TodoApi.Data;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Services
{
    /// <summary>
    /// Service để tạo indexes cho multi-tenant collections
    /// </summary>
    public class IndexCreationService
    {
        private readonly IMongoClient _mongoClient;
        private readonly MongoDbContext _mainContext;
        private readonly ILogger<IndexCreationService> _logger;

        public IndexCreationService(
            IMongoClient mongoClient,
            MongoDbContext mainContext,
            ILogger<IndexCreationService> logger)
        {
            _mongoClient = mongoClient;
            _mainContext = mainContext;
            _logger = logger;
        }

        /// <summary>
        /// Tạo tất cả indexes cho main database
        /// </summary>
        public async Task<IndexCreationResult> CreateIndexesForMainDatabaseAsync()
        {
            var result = new IndexCreationResult
            {
                StartTime = DateTime.UtcNow,
                DatabaseName = _mainContext.Database.DatabaseNamespace.DatabaseName
            };

            try
            {
                _logger.LogInformation("Creating indexes for main database: {DatabaseName}", result.DatabaseName);

                // Create indexes for todoLists
                result.TodoListsIndexesCreated = await CreateTodoListsIndexesAsync(_mainContext.Database);

                // Create indexes for todoItems
                result.TodoItemsIndexesCreated = await CreateTodoItemsIndexesAsync(_mainContext.Database);

                // Create indexes for userApps
                result.UserAppsIndexesCreated = await CreateUserAppsIndexesAsync(_mainContext.Database);

                result.Success = true;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogInformation("Index creation completed for main database. Duration: {Duration}ms", result.Duration.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogError(ex, "Error creating indexes for main database");
                return result;
            }
        }

        /// <summary>
        /// Tạo indexes cho separate database (app database)
        /// </summary>
        public async Task<IndexCreationResult> CreateIndexesForAppDatabaseAsync(string databaseName)
        {
            var result = new IndexCreationResult
            {
                StartTime = DateTime.UtcNow,
                DatabaseName = databaseName
            };

            try
            {
                _logger.LogInformation("Creating indexes for app database: {DatabaseName}", databaseName);

                var database = _mongoClient.GetDatabase(databaseName);

                // Create indexes for todoLists
                result.TodoListsIndexesCreated = await CreateTodoListsIndexesAsync(database);

                // Create indexes for todoItems
                result.TodoItemsIndexesCreated = await CreateTodoItemsIndexesAsync(database);

                // Note: userApps không có trong separate database (chỉ có trong main database)

                result.Success = true;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogInformation("Index creation completed for app database: {DatabaseName}. Duration: {Duration}ms", 
                    databaseName, result.Duration.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogError(ex, "Error creating indexes for app database: {DatabaseName}", databaseName);
                return result;
            }
        }

        /// <summary>
        /// Tạo indexes cho tất cả separate databases (từ UserApps)
        /// </summary>
        public async Task<Dictionary<string, IndexCreationResult>> CreateIndexesForAllAppDatabasesAsync()
        {
            var results = new Dictionary<string, IndexCreationResult>();

            try
            {
                // Lấy tất cả UserApps với separate database mode
                var filter = Builders<UserApp>.Filter.And(
                    Builders<UserApp>.Filter.Eq(app => app.TenantMode, "separate"),
                    Builders<UserApp>.Filter.Ne(app => app.DatabaseName, null)
                );

                var apps = await _mainContext.UserApps.Find(filter).ToListAsync();

                _logger.LogInformation("Found {Count} apps with separate databases", apps.Count);

                foreach (var app in apps)
                {
                    if (!string.IsNullOrWhiteSpace(app.DatabaseName))
                    {
                        var result = await CreateIndexesForAppDatabaseAsync(app.DatabaseName);
                        results[app.DatabaseName] = result;
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes for all app databases");
                throw;
            }
        }

        /// <summary>
        /// Tạo indexes cho todoLists collection
        /// </summary>
        private async Task<int> CreateTodoListsIndexesAsync(IMongoDatabase database)
        {
            int indexesCreated = 0;
            var collection = database.GetCollection<TodoList>("todoLists");

            try
            {
                // Compound index: (appUserId, appId)
                var index1 = Builders<TodoList>.IndexKeys
                    .Ascending(list => list.AppUserId)
                    .Ascending(list => list.AppId);
                var index1Options = new CreateIndexOptions 
                { 
                    Name = "idx_appUserId_appId",
                    Background = true // Create in background
                };

                if (!await IndexExistsAsync(collection, "idx_appUserId_appId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoList>(index1, index1Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoLists.idx_appUserId_appId");
                }

                // Index: appId
                var index2 = Builders<TodoList>.IndexKeys.Ascending(list => list.AppId);
                var index2Options = new CreateIndexOptions 
                { 
                    Name = "idx_appId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoList>(index2, index2Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoLists.idx_appId");
                }

                // Index: appUserId (verify existing)
                var index3 = Builders<TodoList>.IndexKeys.Ascending(list => list.AppUserId);
                var index3Options = new CreateIndexOptions 
                { 
                    Name = "idx_appUserId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appUserId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoList>(index3, index3Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoLists.idx_appUserId");
                }

                return indexesCreated;
            }
            catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.CodeName == "IndexKeySpecsConflict")
            {
                _logger.LogWarning("Some indexes may already exist for todoLists: {Message}", ex.Message);
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes for todoLists");
                throw;
            }
        }

        /// <summary>
        /// Tạo indexes cho todoItems collection
        /// </summary>
        private async Task<int> CreateTodoItemsIndexesAsync(IMongoDatabase database)
        {
            int indexesCreated = 0;
            var collection = database.GetCollection<TodoItem>("todoItems");

            try
            {
                // Compound index: (appId, todoListId)
                var index1 = Builders<TodoItem>.IndexKeys
                    .Ascending(item => item.AppId)
                    .Ascending(item => item.TodoListId);
                var index1Options = new CreateIndexOptions 
                { 
                    Name = "idx_appId_todoListId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appId_todoListId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoItem>(index1, index1Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoItems.idx_appId_todoListId");
                }

                // Index: todoListId (verify existing)
                var index2 = Builders<TodoItem>.IndexKeys.Ascending(item => item.TodoListId);
                var index2Options = new CreateIndexOptions 
                { 
                    Name = "idx_todoListId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_todoListId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoItem>(index2, index2Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoItems.idx_todoListId");
                }

                // Index: appId
                var index3 = Builders<TodoItem>.IndexKeys.Ascending(item => item.AppId);
                var index3Options = new CreateIndexOptions 
                { 
                    Name = "idx_appId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<TodoItem>(index3, index3Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: todoItems.idx_appId");
                }

                return indexesCreated;
            }
            catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.CodeName == "IndexKeySpecsConflict")
            {
                _logger.LogWarning("Some indexes may already exist for todoItems: {Message}", ex.Message);
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes for todoItems");
                throw;
            }
        }

        /// <summary>
        /// Tạo indexes cho userApps collection (chỉ trong main database)
        /// </summary>
        private async Task<int> CreateUserAppsIndexesAsync(IMongoDatabase database)
        {
            int indexesCreated = 0;
            var collection = database.GetCollection<UserApp>("userApps");

            try
            {
                // Index: appUserId (verify existing)
                var index1 = Builders<UserApp>.IndexKeys.Ascending(app => app.AppUserId);
                var index1Options = new CreateIndexOptions 
                { 
                    Name = "idx_appUserId",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appUserId"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<UserApp>(index1, index1Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: userApps.idx_appUserId");
                }

                // Index: tenantMode
                var index2 = Builders<UserApp>.IndexKeys.Ascending(app => app.TenantMode);
                var index2Options = new CreateIndexOptions 
                { 
                    Name = "idx_tenantMode",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_tenantMode"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<UserApp>(index2, index2Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: userApps.idx_tenantMode");
                }

                // Index: databaseName
                var index3 = Builders<UserApp>.IndexKeys.Ascending(app => app.DatabaseName);
                var index3Options = new CreateIndexOptions 
                { 
                    Name = "idx_databaseName",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_databaseName"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<UserApp>(index3, index3Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: userApps.idx_databaseName");
                }

                // Compound index: (appUserId, tenantMode)
                var index4 = Builders<UserApp>.IndexKeys
                    .Ascending(app => app.AppUserId)
                    .Ascending(app => app.TenantMode);
                var index4Options = new CreateIndexOptions 
                { 
                    Name = "idx_appUserId_tenantMode",
                    Background = true
                };

                if (!await IndexExistsAsync(collection, "idx_appUserId_tenantMode"))
                {
                    await collection.Indexes.CreateOneAsync(new CreateIndexModel<UserApp>(index4, index4Options));
                    indexesCreated++;
                    _logger.LogInformation("Created index: userApps.idx_appUserId_tenantMode");
                }

                return indexesCreated;
            }
            catch (MongoCommandException ex) when (ex.CodeName == "IndexOptionsConflict" || ex.CodeName == "IndexKeySpecsConflict")
            {
                _logger.LogWarning("Some indexes may already exist for userApps: {Message}", ex.Message);
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes for userApps");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra xem index đã tồn tại chưa
        /// </summary>
        private async Task<bool> IndexExistsAsync<T>(IMongoCollection<T> collection, string indexName)
        {
            try
            {
                var indexes = await collection.Indexes.ListAsync();
                var indexList = await indexes.ToListAsync();
                return indexList.Any(idx => idx["name"].AsString == indexName);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Get index status cho một database
        /// </summary>
        public async Task<IndexStatus> GetIndexStatusAsync(string? databaseName = null)
        {
            var status = new IndexStatus
            {
                DatabaseName = databaseName ?? _mainContext.Database.DatabaseNamespace.DatabaseName
            };

            try
            {
                var database = string.IsNullOrWhiteSpace(databaseName) 
                    ? _mainContext.Database 
                    : _mongoClient.GetDatabase(databaseName);

                // Get indexes for todoLists
                var todoListsCollection = database.GetCollection<TodoList>("todoLists");
                var todoListsIndexes = await todoListsCollection.Indexes.ListAsync();
                status.TodoListsIndexes = (await todoListsIndexes.ToListAsync())
                    .Select(idx => idx["name"].AsString)
                    .ToList();

                // Get indexes for todoItems
                var todoItemsCollection = database.GetCollection<TodoItem>("todoItems");
                var todoItemsIndexes = await todoItemsCollection.Indexes.ListAsync();
                status.TodoItemsIndexes = (await todoItemsIndexes.ToListAsync())
                    .Select(idx => idx["name"].AsString)
                    .ToList();

                // Get indexes for userApps (chỉ trong main database)
                if (string.IsNullOrWhiteSpace(databaseName))
                {
                    var userAppsCollection = database.GetCollection<UserApp>("userApps");
                    var userAppsIndexes = await userAppsCollection.Indexes.ListAsync();
                    status.UserAppsIndexes = (await userAppsIndexes.ToListAsync())
                        .Select(idx => idx["name"].AsString)
                        .ToList();
                }

                status.Success = true;
            }
            catch (Exception ex)
            {
                status.Success = false;
                status.ErrorMessage = ex.Message;
                _logger.LogError(ex, "Error getting index status for database: {DatabaseName}", status.DatabaseName);
            }

            return status;
        }
    }

    /// <summary>
    /// Kết quả tạo indexes
    /// </summary>
    public class IndexCreationResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
        public string DatabaseName { get; set; } = string.Empty;
        public int TodoListsIndexesCreated { get; set; }
        public int TodoItemsIndexesCreated { get; set; }
        public int UserAppsIndexesCreated { get; set; }
    }

    /// <summary>
    /// Trạng thái indexes
    /// </summary>
    public class IndexStatus
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string DatabaseName { get; set; } = string.Empty;
        public List<string> TodoListsIndexes { get; set; } = new List<string>();
        public List<string> TodoItemsIndexes { get; set; } = new List<string>();
        public List<string> UserAppsIndexes { get; set; } = new List<string>();
    }
}
