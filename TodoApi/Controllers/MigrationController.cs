using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.Services;

namespace TodoApi.Controllers
{
    /// <summary>
    /// Controller để chạy migration cho multi-tenant architecture
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")] // Chỉ admin mới được chạy migration
    public class MigrationController : ControllerBase
    {
        private readonly MultiTenantMigrationService _migrationService;
        private readonly IndexCreationService _indexService;
        private readonly ILogger<MigrationController> _logger;

        public MigrationController(
            MultiTenantMigrationService migrationService,
            IndexCreationService indexService,
            ILogger<MigrationController> logger)
        {
            _migrationService = migrationService;
            _indexService = indexService;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/migration/status - Kiểm tra migration status
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<MigrationStatus>> GetMigrationStatus()
        {
            try
            {
                var status = await _migrationService.GetMigrationStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting migration status");
                return StatusCode(500, new { 
                    message = "Error getting migration status", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// POST: api/migration/run - Chạy migration
        /// </summary>
        [HttpPost("run")]
        public async Task<ActionResult<MigrationResult>> RunMigration()
        {
            try
            {
                _logger.LogInformation("Migration started by user: {UserId}", User.Identity?.Name);

                var result = await _migrationService.RunMigrationAsync();

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return StatusCode(500, result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running migration");
                return StatusCode(500, new { 
                    message = "Error running migration", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// POST: api/migration/create-indexes - Tạo indexes cho main database
        /// </summary>
        [HttpPost("create-indexes")]
        public async Task<ActionResult<IndexCreationResult>> CreateIndexes([FromQuery] string? databaseName = null)
        {
            try
            {
                _logger.LogInformation("Index creation started by user: {UserId}", User.Identity?.Name);

                IndexCreationResult result;

                if (string.IsNullOrWhiteSpace(databaseName))
                {
                    // Create indexes for main database
                    result = await _indexService.CreateIndexesForMainDatabaseAsync();
                }
                else
                {
                    // Create indexes for specific app database
                    result = await _indexService.CreateIndexesForAppDatabaseAsync(databaseName);
                }

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return StatusCode(500, result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes");
                return StatusCode(500, new { 
                    message = "Error creating indexes", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// POST: api/migration/create-indexes-all-apps - Tạo indexes cho tất cả app databases
        /// </summary>
        [HttpPost("create-indexes-all-apps")]
        public async Task<ActionResult<Dictionary<string, IndexCreationResult>>> CreateIndexesForAllApps()
        {
            try
            {
                _logger.LogInformation("Index creation for all apps started by user: {UserId}", User.Identity?.Name);

                var results = await _indexService.CreateIndexesForAllAppDatabasesAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating indexes for all apps");
                return StatusCode(500, new { 
                    message = "Error creating indexes for all apps", 
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// GET: api/migration/index-status - Kiểm tra index status
        /// </summary>
        [HttpGet("index-status")]
        public async Task<ActionResult<IndexStatus>> GetIndexStatus([FromQuery] string? databaseName = null)
        {
            try
            {
                var status = await _indexService.GetIndexStatusAsync(databaseName);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting index status");
                return StatusCode(500, new { 
                    message = "Error getting index status", 
                    error = ex.Message
                });
            }
        }
    }
}
