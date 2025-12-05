using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserAppsController : ControllerBase
    {
        private readonly TodoContext _context;

        public UserAppsController(TodoContext context)
        {
            _context = context;
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

            var query = _context.UserApps.Where(a => a.AppUserId == userId);

            // Apply filter
            if (filter == "created")
            {
                query = query.Where(a => a.Source == "created");
            }
            else if (filter == "downloaded")
            {
                query = query.Where(a => a.Source == "downloaded");
            }

            var apps = await query
                .OrderByDescending(a => a.UpdatedAt)
                .Select(a => new UserAppDTO
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
                })
                .ToListAsync();

            return Ok(apps);
        }

        /// <summary>
        /// GET: api/userapps/{id} - Get a single app
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserAppDTO>> GetUserApp(long id)
        {
            var userId = GetCurrentUserId();

            var app = await _context.UserApps
                .FirstOrDefaultAsync(a => a.Id == id && a.AppUserId == userId);

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

            _context.UserApps.Add(app);
            await _context.SaveChangesAsync();

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

            _context.UserApps.Add(app);
            await _context.SaveChangesAsync();

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
        public async Task<IActionResult> UpdateUserApp(long id, UpdateUserAppDTO updateDto)
        {
            var userId = GetCurrentUserId();

            var app = await _context.UserApps
                .FirstOrDefaultAsync(a => a.Id == id && a.AppUserId == userId);

            if (app == null)
            {
                return NotFound(new { message = "App not found" });
            }

            // Only allow editing apps created by user
            if (app.Source != "created")
            {
                return BadRequest(new { message = "Cannot edit downloaded apps" });
            }

            // Update fields
            if (!string.IsNullOrEmpty(updateDto.Name))
                app.Name = updateDto.Name;
            if (!string.IsNullOrEmpty(updateDto.Icon))
                app.Icon = updateDto.Icon;
            if (updateDto.Description != null)
                app.Description = updateDto.Description;
            if (updateDto.Config != null)
                app.Config = updateDto.Config;

            app.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new UserAppDTO
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
        /// DELETE: api/userapps/{id} - Delete an app
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserApp(long id)
        {
            var userId = GetCurrentUserId();

            var app = await _context.UserApps
                .FirstOrDefaultAsync(a => a.Id == id && a.AppUserId == userId);

            if (app == null)
            {
                return NotFound(new { message = "App not found" });
            }

            _context.UserApps.Remove(app);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// POST: api/userapps/download/{marketplaceAppId} - Download an app from Marketplace
        /// </summary>
        [HttpPost("download/{marketplaceAppId}")]
        public async Task<ActionResult<UserAppDTO>> DownloadFromMarketplace(long marketplaceAppId)
        {
            var userId = GetCurrentUserId();

            // Find the marketplace app (published project)
            var marketplaceApp = await _context.Projects
                .Include(p => p.AppUser)
                .FirstOrDefaultAsync(p => p.Id == marketplaceAppId && p.IsPublished);

            if (marketplaceApp == null)
            {
                return NotFound(new { message = "Marketplace app not found" });
            }

            // Check if user already downloaded this app
            var existingDownload = await _context.UserApps
                .FirstOrDefaultAsync(a => a.AppUserId == userId && a.MarketplaceAppId == marketplaceAppId);

            if (existingDownload != null)
            {
                return BadRequest(new { message = "You have already downloaded this app" });
            }

            // Create a copy for the user
            var userApp = new UserApp
            {
                Name = marketplaceApp.Name,
                Icon = "📱", // Default icon
                Description = marketplaceApp.Description,
                Config = marketplaceApp.JsonData,
                Source = "downloaded",
                MarketplaceAppId = marketplaceAppId,
                OriginalAuthor = marketplaceApp.AppUser?.UserName ?? "Unknown",
                AppUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.UserApps.Add(userApp);
            await _context.SaveChangesAsync();

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
