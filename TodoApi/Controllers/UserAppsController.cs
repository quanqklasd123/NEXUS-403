using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using TodoApi.Services;
using TodoApi.Helpers;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserAppsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly TenantDatabaseService _tenantDatabaseService;
        private readonly TenantSecurityHelper _securityHelper;
        private readonly ILogger<UserAppsController> _logger;

        public UserAppsController(
            MongoDbContext mongoContext,
            TenantDatabaseService tenantDatabaseService,
            TenantSecurityHelper securityHelper,
            ILogger<UserAppsController> logger)
        {
            _mongoContext = mongoContext;
            _tenantDatabaseService = tenantDatabaseService;
            _securityHelper = securityHelper;
            _logger = logger;
        }

        // Helper to get current user ID
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        }

        /// <summary>
        /// GET: api/userapps - Get all user's apps
        /// Query: ?filter=all|created|downloaded
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserAppDTO>>> GetUserApps([FromQuery] string filter = "all")
        {
            var userId = GetCurrentUserId();

            var baseFilter = Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId);
            FilterDefinition<UserApp>? filterDef = null;

            // Apply filter
            if (filter == "created")
            {
                filterDef = Builders<UserApp>.Filter.And(
                    baseFilter,
                    Builders<UserApp>.Filter.Eq(a => a.Source, "created")
                );
            }
            else if (filter == "downloaded")
            {
                filterDef = Builders<UserApp>.Filter.And(
                    baseFilter,
                    Builders<UserApp>.Filter.Eq(a => a.Source, "downloaded")
                );
            }
            else
            {
                filterDef = baseFilter;
            }

            var apps = await _mongoContext.UserApps
                .Find(filterDef)
                .SortByDescending(a => a.UpdatedAt)
                .ToListAsync();

            var appDtos = apps.Select(a => new UserAppDTO
            {
                Id = a.Id,
                Name = a.Name,
                Icon = a.Icon,
                Description = a.Description,
                Config = a.Config,
                Source = a.Source,
                MarketplaceAppId = a.MarketplaceAppId,
                OriginalAuthor = a.OriginalAuthor,
                TenantMode = a.TenantMode,
                DatabaseName = a.DatabaseName,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            }).ToList();

            return Ok(appDtos);
        }

        /// <summary>
        /// GET: api/userapps/{id} - Get a single app
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserAppDTO>> GetUserApp(string id)
        {
            var userId = GetCurrentUserId();

            // Validate AppId format
            if (!_securityHelper.IsValidObjectId(id))
            {
                _logger.LogWarning("Invalid AppId format: {AppId}", id);
                return BadRequest(new { message = "Invalid AppId format" });
            }

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var app = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

            if (app == null)
            {
                // Return 404 để không leak info
                _logger.LogWarning("App not found or access denied: AppId={AppId}, UserId={UserId}", id, userId);
                return NotFound(new { message = "App not found" });
            }

            return new UserAppDTO
            {
                Id = app.Id,
                Name = app.Name,
                Icon = app.Icon,
                Description = app.Description,
                Config = app.Config,
                Source = app.Source,
                MarketplaceAppId = app.MarketplaceAppId,
                OriginalAuthor = app.OriginalAuthor,
                TenantMode = app.TenantMode,
                DatabaseName = app.DatabaseName,
                CreatedAt = app.CreatedAt,
                UpdatedAt = app.UpdatedAt
            };
        }

        /// <summary>
        /// POST: api/userapps - Create a new app
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<UserAppDTO>> CreateUserApp(CreateUserAppDTO createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var tenantMode = createDto.TenantMode ?? "shared";
                string? databaseName = null;

                // Nếu tenantMode = "separate", tạo database riêng
                if (tenantMode == "separate")
                {
                    // Tạo app trước để có appId
                    var app = new UserApp
                    {
                        Name = createDto.Name,
                        Icon = createDto.Icon,
                        Description = createDto.Description,
                        Config = createDto.Config,
                        Source = createDto.Source,
                        AppUserId = userId,
                        TenantMode = tenantMode,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _mongoContext.UserApps.InsertOneAsync(app);

                    // Generate database name sau khi có appId
                    databaseName = _tenantDatabaseService.GenerateDatabaseName(app.Id);
                    
                    // Tạo separate database
                    await _tenantDatabaseService.CreateSeparateDatabaseAsync(databaseName);

                    // Update app với databaseName
                    var updateFilter = Builders<UserApp>.Filter.Eq(a => a.Id, app.Id);
                    var update = Builders<UserApp>.Update
                        .Set(a => a.DatabaseName, databaseName);
                    await _mongoContext.UserApps.UpdateOneAsync(updateFilter, update);

                    app.DatabaseName = databaseName;

                    _logger.LogInformation("Created UserApp with separate database: AppId={AppId}, Database={DatabaseName}", app.Id, databaseName);

                    return CreatedAtAction(nameof(GetUserApp), new { id = app.Id }, new UserAppDTO
                    {
                        Id = app.Id,
                        Name = app.Name,
                        Icon = app.Icon,
                        Description = app.Description,
                        Config = app.Config,
                        Source = app.Source,
                        TenantMode = app.TenantMode,
                        DatabaseName = app.DatabaseName,
                        CreatedAt = app.CreatedAt,
                        UpdatedAt = app.UpdatedAt
                    });
                }
                else
                {
                    // Shared mode: DatabaseName = null
                    var app = new UserApp
                    {
                        Name = createDto.Name,
                        Icon = createDto.Icon,
                        Description = createDto.Description,
                        Config = createDto.Config,
                        Source = createDto.Source,
                        AppUserId = userId,
                        TenantMode = tenantMode,
                        DatabaseName = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _mongoContext.UserApps.InsertOneAsync(app);

                    return CreatedAtAction(nameof(GetUserApp), new { id = app.Id }, new UserAppDTO
                    {
                        Id = app.Id,
                        Name = app.Name,
                        Icon = app.Icon,
                        Description = app.Description,
                        Config = app.Config,
                        Source = app.Source,
                        TenantMode = app.TenantMode,
                        DatabaseName = app.DatabaseName,
                        CreatedAt = app.CreatedAt,
                        UpdatedAt = app.UpdatedAt
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating UserApp");
                return StatusCode(500, new { 
                    message = "Error creating app", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// POST: api/userapps/save-from-builder - Save app from App Builder
        /// Default: shared mode
        /// </summary>
        [HttpPost("save-from-builder")]
        public async Task<ActionResult<UserAppDTO>> SaveFromBuilder(SaveFromBuilderDTO dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var app = new UserApp
                {
                    Name = dto.Name,
                    Icon = dto.Icon,
                    Description = dto.Description,
                    Config = dto.Config,
                    Source = "created",
                    AppUserId = userId,
                    TenantMode = "shared", // Default: shared mode
                    DatabaseName = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _mongoContext.UserApps.InsertOneAsync(app);

                return CreatedAtAction(nameof(GetUserApp), new { id = app.Id }, new UserAppDTO
                {
                    Id = app.Id,
                    Name = app.Name,
                    Icon = app.Icon,
                    Description = app.Description,
                    Config = app.Config,
                    Source = app.Source,
                    TenantMode = app.TenantMode,
                    DatabaseName = app.DatabaseName,
                    CreatedAt = app.CreatedAt,
                    UpdatedAt = app.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving app from builder");
                return StatusCode(500, new { 
                    message = "Error saving app", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// PUT: api/userapps/{id} - Update an existing app (only for source='created')
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserApp(string id, UpdateUserAppDTO updateDto)
        {
            var userId = GetCurrentUserId();

            // Validate AppId format
            if (!_securityHelper.IsValidObjectId(id))
            {
                _logger.LogWarning("Invalid AppId format: {AppId}", id);
                return BadRequest(new { message = "Invalid AppId format" });
            }

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var app = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

            if (app == null)
            {
                _logger.LogWarning("App not found or access denied: AppId={AppId}, UserId={UserId}", id, userId);
                return NotFound(new { message = "App not found" });
            }

            // Only allow editing apps created by user
            if (app.Source != "created")
            {
                return BadRequest(new { message = "Cannot edit downloaded apps" });
            }

            // Build update
            var update = Builders<UserApp>.Update.Set(a => a.UpdatedAt, DateTime.UtcNow);
            
            if (!string.IsNullOrEmpty(updateDto.Name))
                update = update.Set(a => a.Name, updateDto.Name);
            if (!string.IsNullOrEmpty(updateDto.Icon))
                update = update.Set(a => a.Icon, updateDto.Icon);
            if (updateDto.Description != null)
                update = update.Set(a => a.Description, updateDto.Description);
            if (updateDto.Config != null)
                update = update.Set(a => a.Config, updateDto.Config);

            await _mongoContext.UserApps.UpdateOneAsync(filter, update);

            // Reload để lấy dữ liệu mới nhất
            var updatedApp = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

            return Ok(new UserAppDTO
            {
                Id = updatedApp!.Id,
                Name = updatedApp.Name,
                Icon = updatedApp.Icon,
                Description = updatedApp.Description,
                Config = updatedApp.Config,
                Source = updatedApp.Source,
                TenantMode = updatedApp.TenantMode,
                DatabaseName = updatedApp.DatabaseName,
                CreatedAt = updatedApp.CreatedAt,
                UpdatedAt = updatedApp.UpdatedAt
            });
        }

        /// <summary>
        /// DELETE: api/userapps/{id} - Delete an app
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserApp(string id)
        {
            var userId = GetCurrentUserId();

            // Validate AppId format
            if (!_securityHelper.IsValidObjectId(id))
            {
                _logger.LogWarning("Invalid AppId format: {AppId}", id);
                return BadRequest(new { message = "Invalid AppId format" });
            }

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var result = await _mongoContext.UserApps.DeleteOneAsync(filter);

            if (result.DeletedCount == 0)
            {
                _logger.LogWarning("App not found or access denied: AppId={AppId}, UserId={UserId}", id, userId);
                return NotFound(new { message = "App not found" });
            }

            _logger.LogInformation("UserApp deleted: AppId={AppId}, UserId={UserId}", id, userId);
            return NoContent();
        }

        /// <summary>
        /// POST: api/userapps/download/{marketplaceAppId} - Download an app from Marketplace
        /// </summary>
        [HttpPost("download/{marketplaceAppId}")]
        public async Task<ActionResult<UserAppDTO>> DownloadFromMarketplace(string marketplaceAppId)
        {
            var userId = GetCurrentUserId();

            // Find the marketplace app (published project)
            var projectFilter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, marketplaceAppId),
                Builders<Project>.Filter.Eq(p => p.IsPublished, true)
            );
            var marketplaceApp = await _mongoContext.Projects.Find(projectFilter).FirstOrDefaultAsync();

            if (marketplaceApp == null)
            {
                return NotFound(new { message = "Marketplace app not found" });
            }

            // Check if user already downloaded this app
            var downloadFilter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId),
                Builders<UserApp>.Filter.Eq(a => a.MarketplaceAppId, marketplaceAppId)
            );
            var existingDownload = await _mongoContext.UserApps.Find(downloadFilter).FirstOrDefaultAsync();

            if (existingDownload != null)
            {
                return BadRequest(new { message = "You have already downloaded this app" });
            }

            // Get author name from Identity (vẫn dùng SQL Server cho Identity)
            // Tạm thời dùng "Unknown" vì không có navigation property
            var userApp = new UserApp
            {
                Name = marketplaceApp.Name,
                Icon = "📱", // Default icon
                Description = marketplaceApp.Description,
                Config = marketplaceApp.JsonData,
                Source = "downloaded",
                MarketplaceAppId = marketplaceAppId,
                OriginalAuthor = "Unknown", // TODO: Get from Identity if needed
                AppUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _mongoContext.UserApps.InsertOneAsync(userApp);

            return CreatedAtAction(nameof(GetUserApp), new { id = userApp.Id }, new UserAppDTO
            {
                Id = userApp.Id,
                Name = userApp.Name,
                Icon = userApp.Icon,
                Description = userApp.Description,
                Config = userApp.Config,
                Source = userApp.Source,
                MarketplaceAppId = userApp.MarketplaceAppId,
                OriginalAuthor = userApp.OriginalAuthor,
                TenantMode = userApp.TenantMode,
                DatabaseName = userApp.DatabaseName,
                CreatedAt = userApp.CreatedAt,
                UpdatedAt = userApp.UpdatedAt
            });
        }

        /// <summary>
        /// POST: api/userapps/{id}/switch-tenant-mode - Switch tenant mode của app
        /// </summary>
        [HttpPost("{id}/switch-tenant-mode")]
        public async Task<ActionResult<UserAppDTO>> SwitchTenantMode(string id, SwitchTenantModeDTO dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Validate AppId format
                if (!_securityHelper.IsValidObjectId(id))
                {
                    _logger.LogWarning("Invalid AppId format in switch-tenant-mode: {AppId}", id);
                    return BadRequest(new { message = "Invalid AppId format" });
                }

                // Verify ownership
                var filter = Builders<UserApp>.Filter.And(
                    Builders<UserApp>.Filter.Eq(a => a.Id, id),
                    Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
                );

                var app = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

                if (app == null)
                {
                    // Return 404 để không leak info về app existence
                    _logger.LogWarning("App not found or access denied: AppId={AppId}, UserId={UserId}", id, userId);
                    return NotFound(new { message = "App not found" });
                }

                var newTenantMode = dto.TenantMode?.ToLower() ?? "shared";

                if (newTenantMode != "shared" && newTenantMode != "separate")
                {
                    return BadRequest(new { message = "TenantMode must be 'shared' or 'separate'" });
                }

                // Nếu đã ở mode đó rồi, không cần làm gì
                if (app.TenantMode == newTenantMode)
                {
                    _logger.LogInformation("App {AppId} already in {TenantMode} mode", id, newTenantMode);
                    return Ok(new UserAppDTO
                    {
                        Id = app.Id,
                        Name = app.Name,
                        Icon = app.Icon,
                        Description = app.Description,
                        Config = app.Config,
                        Source = app.Source,
                        MarketplaceAppId = app.MarketplaceAppId,
                        OriginalAuthor = app.OriginalAuthor,
                        TenantMode = app.TenantMode,
                        DatabaseName = app.DatabaseName,
                        CreatedAt = app.CreatedAt,
                        UpdatedAt = app.UpdatedAt
                    });
                }

                // Switch từ shared → separate
                if (app.TenantMode == "shared" && newTenantMode == "separate")
                {
                    _logger.LogInformation("Switching app {AppId} from shared to separate mode", id);

                    // Generate database name
                    var databaseName = _tenantDatabaseService.GenerateDatabaseName(app.Id);

                    // Migrate data từ main database sang separate database
                    var migrationResult = await _tenantDatabaseService.MigrateToSeparateDatabaseAsync(app.Id, databaseName);

                    if (!migrationResult.Success)
                    {
                        return StatusCode(500, new { 
                            message = "Migration failed", 
                            error = migrationResult.ErrorMessage
                        });
                    }

                    // Update UserApp
                    var update = Builders<UserApp>.Update
                        .Set(a => a.TenantMode, newTenantMode)
                        .Set(a => a.DatabaseName, databaseName)
                        .Set(a => a.UpdatedAt, DateTime.UtcNow);

                    await _mongoContext.UserApps.UpdateOneAsync(filter, update);

                    app.TenantMode = newTenantMode;
                    app.DatabaseName = databaseName;

                    _logger.LogInformation("App {AppId} switched to separate mode. Database: {DatabaseName}", id, databaseName);
                }
                // Switch từ separate → shared
                else if (app.TenantMode == "separate" && newTenantMode == "shared")
                {
                    _logger.LogInformation("Switching app {AppId} from separate to shared mode", id);

                    if (string.IsNullOrWhiteSpace(app.DatabaseName))
                    {
                        return BadRequest(new { message = "DatabaseName is missing" });
                    }

                    // Migrate data từ separate database về main database
                    var migrationResult = await _tenantDatabaseService.MigrateToMainDatabaseAsync(app.Id, app.DatabaseName);

                    if (!migrationResult.Success)
                    {
                        return StatusCode(500, new { 
                            message = "Migration failed", 
                            error = migrationResult.ErrorMessage
                        });
                    }

                    // Update UserApp
                    var update = Builders<UserApp>.Update
                        .Set(a => a.TenantMode, newTenantMode)
                        .Set(a => a.DatabaseName, (string?)null)
                        .Set(a => a.UpdatedAt, DateTime.UtcNow);

                    await _mongoContext.UserApps.UpdateOneAsync(filter, update);

                    // (Optional) Xóa separate database sau khi migrate
                    // await _tenantDatabaseService.DropSeparateDatabaseAsync(app.DatabaseName);

                    app.TenantMode = newTenantMode;
                    app.DatabaseName = null;

                    _logger.LogInformation("App {AppId} switched to shared mode", id);
                }

                return Ok(new UserAppDTO
                {
                    Id = app.Id,
                    Name = app.Name,
                    Icon = app.Icon,
                    Description = app.Description,
                    Config = app.Config,
                    Source = app.Source,
                    MarketplaceAppId = app.MarketplaceAppId,
                    OriginalAuthor = app.OriginalAuthor,
                    TenantMode = app.TenantMode,
                    DatabaseName = app.DatabaseName,
                    CreatedAt = app.CreatedAt,
                    UpdatedAt = app.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error switching tenant mode for app {AppId}", id);
                return StatusCode(500, new { 
                    message = "Error switching tenant mode", 
                    error = ex.Message
                });
            }
        }
    }
}
