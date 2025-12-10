using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserAppsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;

        public UserAppsController(MongoDbContext mongoContext)
        {
            _mongoContext = mongoContext;
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

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var app = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

            if (app == null)
            {
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
            var userId = GetCurrentUserId();

            var app = new UserApp
            {
                Name = createDto.Name,
                Icon = createDto.Icon,
                Description = createDto.Description,
                Config = createDto.Config,
                Source = createDto.Source,
                AppUserId = userId,
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
                CreatedAt = app.CreatedAt,
                UpdatedAt = app.UpdatedAt
            });
        }

        /// <summary>
        /// POST: api/userapps/save-from-builder - Save app from App Builder
        /// </summary>
        [HttpPost("save-from-builder")]
        public async Task<ActionResult<UserAppDTO>> SaveFromBuilder(SaveFromBuilderDTO dto)
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
                CreatedAt = app.CreatedAt,
                UpdatedAt = app.UpdatedAt
            });
        }

        /// <summary>
        /// PUT: api/userapps/{id} - Update an existing app (only for source='created')
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserApp(string id, UpdateUserAppDTO updateDto)
        {
            var userId = GetCurrentUserId();

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var app = await _mongoContext.UserApps.Find(filter).FirstOrDefaultAsync();

            if (app == null)
            {
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

            var filter = Builders<UserApp>.Filter.And(
                Builders<UserApp>.Filter.Eq(a => a.Id, id),
                Builders<UserApp>.Filter.Eq(a => a.AppUserId, userId)
            );

            var result = await _mongoContext.UserApps.DeleteOneAsync(filter);

            if (result.DeletedCount == 0)
            {
                return NotFound(new { message = "App not found" });
            }

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
                CreatedAt = userApp.CreatedAt,
                UpdatedAt = userApp.UpdatedAt
            });
        }
    }
}
