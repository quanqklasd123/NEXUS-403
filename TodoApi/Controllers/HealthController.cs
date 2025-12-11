using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using TodoApi.Data;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly ILogger<HealthController> _logger;

        public HealthController(MongoDbContext mongoContext, ILogger<HealthController> logger)
        {
            _mongoContext = mongoContext;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> CheckHealth()
        {
            try
            {
                // Test MongoDB connection
                var collections = await _mongoContext.Projects.Database.ListCollectionNamesAsync();
                var collectionList = await collections.ToListAsync();
                
                // Count documents in each collection
                var projectCount = await _mongoContext.Projects.CountDocumentsAsync(_ => true);
                var todoListCount = await _mongoContext.TodoLists.CountDocumentsAsync(_ => true);
                var todoItemCount = await _mongoContext.TodoItems.CountDocumentsAsync(_ => true);
                var userAppCount = await _mongoContext.UserApps.CountDocumentsAsync(_ => true);
                
                return Ok(new
                {
                    status = "healthy",
                    mongodb = "connected",
                    database = _mongoContext.Projects.Database.DatabaseNamespace.DatabaseName,
                    collections = collectionList,
                    counts = new
                    {
                        projects = projectCount,
                        todoLists = todoListCount,
                        todoItems = todoItemCount,
                        userApps = userAppCount
                    },
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    mongodb = "disconnected",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        // GET: api/health/data - Xem dữ liệu (chỉ cho development)
        [HttpGet("data")]
        public async Task<IActionResult> GetData([FromQuery] string collection = null, [FromQuery] int limit = 10)
        {
            try
            {
                var result = new Dictionary<string, object>();

                if (string.IsNullOrEmpty(collection) || collection == "projects")
                {
                    var projects = await _mongoContext.Projects.Find(_ => true).Limit(limit).ToListAsync();
                    result["projects"] = projects;
                }

                if (string.IsNullOrEmpty(collection) || collection == "todoLists")
                {
                    var todoLists = await _mongoContext.TodoLists.Find(_ => true).Limit(limit).ToListAsync();
                    result["todoLists"] = todoLists;
                }

                if (string.IsNullOrEmpty(collection) || collection == "todoItems")
                {
                    var todoItems = await _mongoContext.TodoItems.Find(_ => true).Limit(limit).ToListAsync();
                    result["todoItems"] = todoItems;
                }

                if (string.IsNullOrEmpty(collection) || collection == "userApps")
                {
                    var userApps = await _mongoContext.UserApps.Find(_ => true).Limit(limit).ToListAsync();
                    result["userApps"] = userApps;
                }

                return Ok(new
                {
                    collection = collection ?? "all",
                    limit = limit,
                    data = result,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting data");
                return StatusCode(500, new
                {
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}

