using MongoDB.Driver;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Data
{
    /// <summary>
    /// Lớp trợ giúp (Helper class) để quản lý database context cho từng ứng dụng (tenant)
    /// Hỗ trợ cả shared database mode (với AppId) và separate database mode (database tách biệt)
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
        /// Lấy database context cho ứng dụng (shared hoặc separate)
        /// Phiên bản đồng bộ (Synchronous version) - sử dụng FirstOrDefault() blocking
        /// Hỗ trợ cả UserApp (Marketplace) và Project (App Builder)
        /// </summary>
        /// <param name="appId">ID của UserApp hoặc Project. Nếu null hoặc empty, trả về main database</param>
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
                // Thử tìm UserApp trước (Marketplace apps)
                var userApp = _mainContext.UserApps
                    .Find(a => a.Id == appId)
                    .FirstOrDefault();

                if (userApp != null)
                {
                    // Nếu là separate database mode và có DatabaseName
                    if (userApp.TenantMode == "separate" && !string.IsNullOrWhiteSpace(userApp.DatabaseName))
                    {
                        _logger?.LogDebug("Using separate database '{DatabaseName}' for UserApp '{AppId}'", userApp.DatabaseName, appId);
                        return _mongoClient.GetDatabase(userApp.DatabaseName);
                    }

                    // Shared database mode hoặc DatabaseName null → dùng main database
                    _logger?.LogDebug("Using shared database (main) for UserApp '{AppId}' (TenantMode: {TenantMode})", appId, userApp.TenantMode);
                    return _mainContext.Database;
                }

                // Không tìm thấy UserApp, thử tìm Project (App Builder)
                var project = _mainContext.Projects
                    .Find(p => p.Id == appId)
                    .FirstOrDefault();

                if (project != null)
                {
                    // Nếu là separate database mode và có DatabaseName
                    if (project.TenantMode == "separate" && !string.IsNullOrWhiteSpace(project.DatabaseName))
                    {
                        _logger?.LogDebug("Using separate database '{DatabaseName}' for Project '{AppId}'", project.DatabaseName, appId);
                        return _mongoClient.GetDatabase(project.DatabaseName);
                    }

                    // Shared database mode hoặc DatabaseName null → dùng main database
                    _logger?.LogDebug("Using shared database (main) for Project '{AppId}' (TenantMode: {TenantMode})", appId, project.TenantMode);
                    return _mainContext.Database;
                }

                // Không tìm thấy cả UserApp và Project
                _logger?.LogWarning("No UserApp or Project found with Id '{AppId}', falling back to main database", appId);
                return _mainContext.Database;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error getting database for app '{AppId}', falling back to main database", appId);
                return _mainContext.Database; // Fallback về main database trong trường hợp lỗi
            }
        }

        /// <summary>
        /// Lấy database context cho ứng dụng (shared hoặc separate) - Phiên bản bất đồng bộ (Async version)
        /// Khuyến nghị (Recommended) cho các async contexts
        /// Hỗ trợ cả UserApp (Marketplace) và Project (App Builder)
        /// </summary>
        /// <param name="appId">ID của UserApp hoặc Project. Nếu null hoặc empty, trả về main database</param>
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
                // Thử tìm UserApp trước (Marketplace apps)
                var userApp = await _mainContext.UserApps
                    .Find(a => a.Id == appId)
                    .FirstOrDefaultAsync();

                if (userApp != null)
                {
                    // Nếu là separate database mode và có DatabaseName
                    if (userApp.TenantMode == "separate" && !string.IsNullOrWhiteSpace(userApp.DatabaseName))
                    {
                        _logger?.LogDebug("Using separate database '{DatabaseName}' for UserApp '{AppId}'", userApp.DatabaseName, appId);
                        return _mongoClient.GetDatabase(userApp.DatabaseName);
                    }

                    // Shared database mode hoặc DatabaseName null → dùng main database
                    _logger?.LogDebug("Using shared database (main) for UserApp '{AppId}' (TenantMode: {TenantMode})", appId, userApp.TenantMode);
                    return _mainContext.Database;
                }

                // Không tìm thấy UserApp, thử tìm Project (App Builder)
                var project = await _mainContext.Projects
                    .Find(p => p.Id == appId)
                    .FirstOrDefaultAsync();

                if (project != null)
                {
                    // Nếu là separate database mode và có DatabaseName
                    if (project.TenantMode == "separate" && !string.IsNullOrWhiteSpace(project.DatabaseName))
                    {
                        _logger?.LogDebug("Using separate database '{DatabaseName}' for Project '{AppId}'", project.DatabaseName, appId);
                        return _mongoClient.GetDatabase(project.DatabaseName);
                    }

                    // Shared database mode hoặc DatabaseName null → dùng main database
                    _logger?.LogDebug("Using shared database (main) for Project '{AppId}' (TenantMode: {TenantMode})", appId, project.TenantMode);
                    return _mainContext.Database;
                }

                // Không tìm thấy cả UserApp và Project
                _logger?.LogWarning("No UserApp or Project found with Id '{AppId}', falling back to main database", appId);
                return _mainContext.Database;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error getting database for app '{AppId}', falling back to main database", appId);
                return _mainContext.Database; // Fallback về main database trong trường hợp lỗi
            }
        }

        /// <summary>
        /// Lấy database context cho Project (App Builder) - hỗ trợ multi-tenant
        /// </summary>
        /// <param name="projectId">ID của Project. Nếu null hoặc empty, trả về main database</param>
        /// <returns>IMongoDatabase cho project hoặc main database nếu projectId không hợp lệ</returns>
        public async Task<IMongoDatabase> GetProjectDatabaseAsync(string? projectId)
        {
            // Nếu projectId null hoặc empty → trả về main database
            if (string.IsNullOrWhiteSpace(projectId))
            {
                return _mainContext.Database;
            }

            try
            {
                // Query Project từ main database để lấy TenantMode và DatabaseName
                var project = await _mainContext.Projects
                    .Find(p => p.Id == projectId)
                    .FirstOrDefaultAsync();

                if (project == null)
                {
                    _logger?.LogWarning("Project with Id '{ProjectId}' not found, falling back to main database", projectId);
                    return _mainContext.Database;
                }

                // Nếu là separate database mode và có DatabaseName
                if (project.TenantMode == "separate" && !string.IsNullOrWhiteSpace(project.DatabaseName))
                {
                    _logger?.LogDebug("Using separate database '{DatabaseName}' for project '{ProjectId}'", project.DatabaseName, projectId);
                    return _mongoClient.GetDatabase(project.DatabaseName);
                }

                // Shared database mode hoặc DatabaseName null → dùng main database
                _logger?.LogDebug("Using shared database (main) for project '{ProjectId}' (TenantMode: {TenantMode})", projectId, project.TenantMode);
                return _mainContext.Database;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error getting database for project '{ProjectId}', falling back to main database", projectId);
                return _mainContext.Database;
            }
        }

        /// <summary>
        /// Lấy collection trong app database (database của ứng dụng)
        /// Hỗ trợ cả UserApp (Marketplace) và Project (App Builder)
        /// </summary>
        /// <typeparam name="T">Kiểu dữ liệu (Type) của document trong collection</typeparam>
        /// <param name="appId">ID của UserApp hoặc Project. Nếu null hoặc empty, dùng main database</param>
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
        /// Lấy collection trong app database - Phiên bản bất đồng bộ (Async version)
        /// Khuyến nghị (Recommended) cho các async contexts
        /// Hỗ trợ cả UserApp (Marketplace) và Project (App Builder)
        /// </summary>
        /// <typeparam name="T">Type của document trong collection</typeparam>
        /// <param name="appId">ID của UserApp hoặc Project. Nếu null hoặc empty, dùng main database</param>
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
