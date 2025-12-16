using MongoDB.Driver;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Data
{
    /// <summary>
    /// Helper class để quản lý database context cho từng app (tenant)
    /// Hỗ trợ cả shared database mode (với AppId) và separate database mode
    /// </summary>
    public class AppDbContext
    {
        private readonly IMongoClient _mongoClient;
        private readonly MongoDbContext _mainContext;
        private readonly ILogger<AppDbContext>? _logger;

        public AppDbContext(IMongoClient mongoClient, MongoDbContext mainContext, ILogger<AppDbContext>? logger = null)
        {
            _mongoClient = mongoClient;
            _mainContext = mainContext;
            _logger = logger;
        }

        /// <summary>
        /// Lấy database context cho app (shared hoặc separate)
        /// Synchronous version - sử dụng FirstOrDefault() blocking
        /// </summary>
        /// <param name="appId">ID của UserApp. Nếu null hoặc empty, trả về main database</param>
        /// <returns>IMongoDatabase cho app hoặc main database nếu appId không hợp lệ</returns>
        public IMongoDatabase GetAppDatabase(string? appId)
        {
            // Nếu appId null hoặc empty → trả về main database
            if (string.IsNullOrWhiteSpace(appId))
            {
                return _mainContext.Database;
            }

            try
            {
                // Query UserApp từ main database để lấy TenantMode và DatabaseName
                // Note: FirstOrDefault() là blocking call, nhưng acceptable cho single document query
                var userApp = _mainContext.UserApps
                    .Find(a => a.Id == appId)
                    .FirstOrDefault();

                if (userApp == null)
                {
                    _logger?.LogWarning("UserApp with Id '{AppId}' not found, falling back to main database", appId);
                    return _mainContext.Database; // Fallback về main database
                }

                // Nếu là separate database mode và có DatabaseName
                if (userApp.TenantMode == "separate" && !string.IsNullOrWhiteSpace(userApp.DatabaseName))
                {
                    _logger?.LogDebug("Using separate database '{DatabaseName}' for app '{AppId}'", userApp.DatabaseName, appId);
                    return _mongoClient.GetDatabase(userApp.DatabaseName);
                }

                // Shared database mode hoặc DatabaseName null → dùng main database
                _logger?.LogDebug("Using shared database (main) for app '{AppId}' (TenantMode: {TenantMode})", appId, userApp.TenantMode);
                return _mainContext.Database;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error getting database for app '{AppId}', falling back to main database", appId);
                return _mainContext.Database; // Fallback về main database trong trường hợp lỗi
            }
        }

        /// <summary>
        /// Lấy database context cho app (shared hoặc separate) - Async version
        /// Recommended cho async contexts
        /// </summary>
        /// <param name="appId">ID của UserApp. Nếu null hoặc empty, trả về main database</param>
        /// <returns>IMongoDatabase cho app hoặc main database nếu appId không hợp lệ</returns>
        public async Task<IMongoDatabase> GetAppDatabaseAsync(string? appId)
        {
            // Nếu appId null hoặc empty → trả về main database
            if (string.IsNullOrWhiteSpace(appId))
            {
                return _mainContext.Database;
            }

            try
            {
                // Query UserApp từ main database để lấy TenantMode và DatabaseName
                var userApp = await _mainContext.UserApps
                    .Find(a => a.Id == appId)
                    .FirstOrDefaultAsync();

                if (userApp == null)
                {
                    _logger?.LogWarning("UserApp with Id '{AppId}' not found, falling back to main database", appId);
                    return _mainContext.Database; // Fallback về main database
                }

                // Nếu là separate database mode và có DatabaseName
                if (userApp.TenantMode == "separate" && !string.IsNullOrWhiteSpace(userApp.DatabaseName))
                {
                    _logger?.LogDebug("Using separate database '{DatabaseName}' for app '{AppId}'", userApp.DatabaseName, appId);
                    return _mongoClient.GetDatabase(userApp.DatabaseName);
                }

                // Shared database mode hoặc DatabaseName null → dùng main database
                _logger?.LogDebug("Using shared database (main) for app '{AppId}' (TenantMode: {TenantMode})", appId, userApp.TenantMode);
                return _mainContext.Database;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error getting database for app '{AppId}', falling back to main database", appId);
                return _mainContext.Database; // Fallback về main database trong trường hợp lỗi
            }
        }

        /// <summary>
        /// Lấy collection trong app database
        /// </summary>
        /// <typeparam name="T">Type của document trong collection</typeparam>
        /// <param name="appId">ID của UserApp. Nếu null hoặc empty, dùng main database</param>
        /// <param name="collectionName">Tên collection</param>
        /// <returns>IMongoCollection từ đúng database (app database hoặc main database)</returns>
        public IMongoCollection<T> GetAppCollection<T>(string? appId, string collectionName)
        {
            if (string.IsNullOrWhiteSpace(collectionName))
            {
                throw new ArgumentException("Collection name cannot be null or empty", nameof(collectionName));
            }

            var database = GetAppDatabase(appId);
            return database.GetCollection<T>(collectionName);
        }

        /// <summary>
        /// Lấy collection trong app database - Async version
        /// Recommended cho async contexts
        /// </summary>
        /// <typeparam name="T">Type của document trong collection</typeparam>
        /// <param name="appId">ID của UserApp. Nếu null hoặc empty, dùng main database</param>
        /// <param name="collectionName">Tên collection</param>
        /// <returns>IMongoCollection từ đúng database (app database hoặc main database)</returns>
        public async Task<IMongoCollection<T>> GetAppCollectionAsync<T>(string? appId, string collectionName)
        {
            if (string.IsNullOrWhiteSpace(collectionName))
            {
                throw new ArgumentException("Collection name cannot be null or empty", nameof(collectionName));
            }

            var database = await GetAppDatabaseAsync(appId);
            return database.GetCollection<T>(collectionName);
        }

        /// <summary>
        /// Lấy main database context (luôn trả về main database, không phụ thuộc vào appId)
        /// </summary>
        public IMongoDatabase GetMainDatabase()
        {
            return _mainContext.Database;
        }

        /// <summary>
        /// Lấy collection từ main database (không phụ thuộc vào appId)
        /// </summary>
        public IMongoCollection<T> GetMainCollection<T>(string collectionName)
        {
            if (string.IsNullOrWhiteSpace(collectionName))
            {
                throw new ArgumentException("Collection name cannot be null or empty", nameof(collectionName));
            }

            return _mainContext.GetCollection<T>(collectionName);
        }
    }
}
