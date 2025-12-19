using MongoDB.Driver;
using MongoDB.Bson;
using TodoApi.Data;
using TodoApi.Models;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace TodoApi.Services
{
    /// <summary>
    /// Dịch vụ (Service) để quản lý database tách biệt cho kiến trúc đa người thuê (multi-tenant)
    /// </summary>
    public class TenantDatabaseService
    {
        private readonly IMongoClient _mongoClient;
        private readonly MongoDbContext _mainContext;
        private readonly ILogger<TenantDatabaseService> _logger;

        public TenantDatabaseService(
            IMongoClient mongoClient,
            MongoDbContext mainContext,
            ILogger<TenantDatabaseService> logger)
        {
            _mongoClient = mongoClient;
            _mainContext = mainContext;
            _logger = logger;
        }

        /// <summary>
        /// Tạo tên database cho ứng dụng (app)
        /// Định dạng (Format): app_{appId} hoặc app_{hash} nếu appId quá dài
        /// </summary>
        public string GenerateDatabaseName(string appId)
        {
            // Quy tắc đặt tên database của MongoDB:
            // - Tối đa 64 ký tự
            // - Không được chứa: /\\. "$
            // - Phân biệt chữ hoa/thường (Case-sensitive)

            // Nếu appId ngắn và hợp lệ, dùng trực tiếp
            if (appId.Length <= 50 && IsValidDatabaseName(appId))
            {
                return $"app_{appId}";
            }

            // Nếu appId dài hoặc không hợp lệ, sử dụng hash (mã hóa)
            var hash = ComputeHash(appId);
            return $"app_{hash}";
        }

        /// <summary>
        /// Kiểm tra tên database có hợp lệ không (theo quy định của MongoDB)
        /// </summary>
        private bool IsValidDatabaseName(string name)
        {
            if (string.IsNullOrWhiteSpace(name) || name.Length > 64)
                return false;

            // Không được chứa các ký tự đặc biệt (theo quy định MongoDB)
            var invalidChars = new[] { '/', '\\', '.', ' ', '"', '$' };
            return !invalidChars.Any(c => name.Contains(c));
        }

        /// <summary>
        /// Tính toán mã hash (Compute hash) cho appId (SHA256, lấy 16 ký tự đầu)
        /// </summary>
        private string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return BitConverter.ToString(hashBytes).Replace("-", "").Substring(0, 16).ToLower();
        }

        /// <summary>
        /// Tạo database tách biệt (separate database) cho ứng dụng
        /// </summary>
        public async Task<IMongoDatabase> CreateSeparateDatabaseAsync(string databaseName)
        {
            try
            {
                _logger.LogInformation("Creating separate database: {DatabaseName}", databaseName);

                var database = _mongoClient.GetDatabase(databaseName);

                // Tạo các collections cơ bản bằng cách chèn và xóa một document thử nghiệm
                // MongoDB tự động tạo database và collection khi ghi dữ liệu lần đầu tiên (first write)
                var testCollection = database.GetCollection<BsonDocument>("_init");
                try
                {
                    await testCollection.InsertOneAsync(new BsonDocument { { "_id", ObjectId.GenerateNewId() }, { "init", true } });
                    await testCollection.DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("init", true));
                }
                catch
                {
                    // Ignore errors, database sẽ được tạo khi có real data
                }

                // Tạo collections cơ bản: todoLists, todoItems
                // (MongoDB sẽ tự tạo khi có data, nhưng có thể tạo trước để đảm bảo)
                await database.CreateCollectionAsync("todoLists");
                await database.CreateCollectionAsync("todoItems");

                _logger.LogInformation("Separate database created: {DatabaseName}", databaseName);
                return database;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating separate database: {DatabaseName}", databaseName);
                throw;
            }
        }

        /// <summary>
        /// Chuyển dữ liệu (Migrate data) từ main database sang separate database
        /// </summary>
        public async Task<DatabaseMigrationResult> MigrateToSeparateDatabaseAsync(string appId, string databaseName)
        {
            var result = new DatabaseMigrationResult
            {
                StartTime = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Migrating data to separate database: AppId={AppId}, Database={DatabaseName}", appId, databaseName);

                var sourceDatabase = _mainContext.Database;
                var targetDatabase = _mongoClient.GetDatabase(databaseName);

                // Đảm bảo target database tồn tại
                await CreateSeparateDatabaseAsync(databaseName);

                // 1. Migrate TodoLists
                var sourceListsCollection = sourceDatabase.GetCollection<TodoList>("todoLists");
                var targetListsCollection = targetDatabase.GetCollection<TodoList>("todoLists");

                var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppId, appId);
                var lists = await sourceListsCollection.Find(listFilter).ToListAsync();

                if (lists.Any())
                {
                    await targetListsCollection.InsertManyAsync(lists);
                    result.TodoListsMigrated = lists.Count;
                    _logger.LogInformation("Migrated {Count} TodoLists", lists.Count);
                }

                // 2. Migrate TodoItems
                var sourceItemsCollection = sourceDatabase.GetCollection<TodoItem>("todoItems");
                var targetItemsCollection = targetDatabase.GetCollection<TodoItem>("todoItems");

                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.AppId, appId);
                var items = await sourceItemsCollection.Find(itemFilter).ToListAsync();

                if (items.Any())
                {
                    await targetItemsCollection.InsertManyAsync(items);
                    result.TodoItemsMigrated = items.Count;
                    _logger.LogInformation("Migrated {Count} TodoItems", items.Count);
                }

                // 3. Verify data integrity
                var targetListCount = await targetListsCollection.CountDocumentsAsync(listFilter);
                var targetItemCount = await targetItemsCollection.CountDocumentsAsync(itemFilter);

                if (targetListCount != lists.Count || targetItemCount != items.Count)
                {
                    throw new Exception($"Data integrity check failed. Expected {lists.Count} lists and {items.Count} items, but got {targetListCount} lists and {targetItemCount} items.");
                }

                // 4. Xóa data cũ từ source database sau khi verify thành công
                if (lists.Any())
                {
                    await sourceListsCollection.DeleteManyAsync(listFilter);
                    _logger.LogInformation("Deleted {Count} TodoLists from source database", lists.Count);
                }

                if (items.Any())
                {
                    await sourceItemsCollection.DeleteManyAsync(itemFilter);
                    _logger.LogInformation("Deleted {Count} TodoItems from source database", items.Count);
                }

                result.Success = true;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogInformation("Migration to separate database completed successfully. Duration: {Duration}ms", result.Duration.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogError(ex, "Migration to separate database failed");
                throw;
            }
        }

        /// <summary>
        /// Chuyển dữ liệu (Migrate data) từ separate database về main database
        /// </summary>
        public async Task<DatabaseMigrationResult> MigrateToMainDatabaseAsync(string appId, string databaseName)
        {
            var result = new DatabaseMigrationResult
            {
                StartTime = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Migrating data from separate database to main: AppId={AppId}, Database={DatabaseName}", appId, databaseName);

                var sourceDatabase = _mongoClient.GetDatabase(databaseName);
                var targetDatabase = _mainContext.Database;

                // 1. Migrate TodoLists
                var sourceListsCollection = sourceDatabase.GetCollection<TodoList>("todoLists");
                var targetListsCollection = targetDatabase.GetCollection<TodoList>("todoLists");

                var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppId, appId);
                var lists = await sourceListsCollection.Find(listFilter).ToListAsync();

                if (lists.Any())
                {
                    await targetListsCollection.InsertManyAsync(lists);
                    result.TodoListsMigrated = lists.Count;
                    _logger.LogInformation("Migrated {Count} TodoLists", lists.Count);
                }

                // 2. Migrate TodoItems
                var sourceItemsCollection = sourceDatabase.GetCollection<TodoItem>("todoItems");
                var targetItemsCollection = targetDatabase.GetCollection<TodoItem>("todoItems");

                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.AppId, appId);
                var items = await sourceItemsCollection.Find(itemFilter).ToListAsync();

                if (items.Any())
                {
                    await targetItemsCollection.InsertManyAsync(items);
                    result.TodoItemsMigrated = items.Count;
                    _logger.LogInformation("Migrated {Count} TodoItems", items.Count);
                }

                // 3. Verify data integrity
                var targetListCount = await targetListsCollection.CountDocumentsAsync(listFilter);
                var targetItemCount = await targetItemsCollection.CountDocumentsAsync(itemFilter);

                if (targetListCount != lists.Count || targetItemCount != items.Count)
                {
                    throw new Exception($"Data integrity check failed. Expected {lists.Count} lists and {items.Count} items, but got {targetListCount} lists and {targetItemCount} items.");
                }

                // 4. Xóa data cũ từ source database sau khi verify thành công
                if (lists.Any())
                {
                    await sourceListsCollection.DeleteManyAsync(listFilter);
                    _logger.LogInformation("Deleted {Count} TodoLists from source database", lists.Count);
                }

                if (items.Any())
                {
                    await sourceItemsCollection.DeleteManyAsync(itemFilter);
                    _logger.LogInformation("Deleted {Count} TodoItems from source database", items.Count);
                }

                result.Success = true;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogInformation("Migration to main database completed successfully. Duration: {Duration}ms", result.Duration.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.EndTime = DateTime.UtcNow;
                result.Duration = result.EndTime - result.StartTime;

                _logger.LogError(ex, "Migration to main database failed");
                throw;
            }
        }

        /// <summary>
        /// Xóa database tách biệt (separate database) sau khi migrate về main
        /// </summary>
        public async Task<bool> DropSeparateDatabaseAsync(string databaseName)
        {
            try
            {
                _logger.LogInformation("Dropping separate database: {DatabaseName}", databaseName);
                await _mongoClient.DropDatabaseAsync(databaseName);
                _logger.LogInformation("Separate database dropped: {DatabaseName}", databaseName);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error dropping separate database: {DatabaseName}", databaseName);
                return false;
            }
        }
    }

    /// <summary>
    /// Kết quả quá trình chuyển dữ liệu (migration) giữa các databases (separate ↔ main)
    /// </summary>
    public class DatabaseMigrationResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
        public int TodoListsMigrated { get; set; }
        public int TodoItemsMigrated { get; set; }
    }
}

