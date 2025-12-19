using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using TodoApi.Services;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Yêu cầu phải đăng nhập mới được truy cập
    public class ProjectsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly TenantDatabaseService _tenantDatabaseService;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(
            MongoDbContext mongoContext, 
            TenantDatabaseService tenantDatabaseService,
            ILogger<ProjectsController> logger)
        {
            _mongoContext = mongoContext;
            _tenantDatabaseService = tenantDatabaseService;
            _logger = logger;
        }

        // Hàm hỗ trợ lấy UserId của người dùng hiện tại từ JWT token
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // 1. GET: api/projects - Lấy danh sách tất cả các projects của tôi (user hiện tại)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetProjects()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                _logger.LogInformation("GetProjects called for userId: {UserId}", userId);

                var filter = Builders<Project>.Filter.Eq(p => p.AppUserId, userId);
                var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
                
                var projects = await _mongoContext.Projects
                    .Find(filter)
                    .Sort(sort)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} projects for user {UserId}", projects.Count, userId);

                var projectDtos = projects.Select(p => new ProjectDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    JsonData = p.JsonData,
                    IsPublished = p.IsPublished,
                    CreatedAt = p.CreatedAt
                }).ToList();

                return Ok(projectDtos);
            }
            catch (MongoException mongoEx)
            {
                _logger.LogError(mongoEx, "MongoDB error retrieving projects");
                return StatusCode(500, new { 
                    message = "Database error", 
                    error = mongoEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects");
                return StatusCode(500, new { 
                    message = "Error retrieving projects", 
                    error = ex.Message
                });
            }
        }

        // 2. GET: api/projects/5 - Lấy thông tin chi tiết của 1 project theo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDTO>> GetProject(string id)
        {
            try
            {
                _logger.LogInformation("GetProject called with id: {ProjectId}", id);
                
                var userId = GetCurrentUserId();
                _logger.LogInformation("Current userId: {UserId}", userId ?? "null");
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                if (string.IsNullOrEmpty(id))
                {
                    _logger.LogWarning("Project ID is empty");
                    return BadRequest(new { message = "Project ID is required" });
                }

                var filter = Builders<Project>.Filter.And(
                    Builders<Project>.Filter.Eq(p => p.Id, id),
                    Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
                );

                _logger.LogInformation("Querying MongoDB with filter: ProjectId={ProjectId}, UserId={UserId}", id, userId);
                
                var project = await _mongoContext.Projects.Find(filter).FirstOrDefaultAsync();

                if (project == null)
                {
                    _logger.LogWarning("Project not found: ProjectId={ProjectId}, UserId={UserId}", id, userId);
                    return NotFound(new { message = "Project not found" });
                }

                _logger.LogInformation("Project found: {ProjectName}", project.Name);

                return new ProjectDTO
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    JsonData = project.JsonData,
                    IsPublished = project.IsPublished,
                    CreatedAt = project.CreatedAt
                };
            }
            catch (MongoException mongoEx)
            {
                _logger.LogError(mongoEx, "MongoDB error retrieving project {ProjectId}", id);
                return StatusCode(500, new { 
                    message = "Database error", 
                    error = mongoEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project {ProjectId}", id);
                return StatusCode(500, new { 
                    message = "Error retrieving project", 
                    error = ex.Message
                });
            }
        }

        // 3. POST: api/projects - Tạo mới một project
        [HttpPost]
        public async Task<ActionResult<ProjectDTO>> PostProject(CreateProjectDTO createDto)
        {
            var userId = GetCurrentUserId();

            // Tạo project với TenantMode
            var project = new Project
            {
                Name = createDto.Name,
                Description = createDto.Description,
                JsonData = createDto.JsonData ?? "[]", // Mặc định là mảng JSON rỗng
                AppUserId = userId,
                CreatedAt = DateTime.UtcNow,
                IsPublished = false,
                TenantMode = createDto.TenantMode ?? "separate" // Mặc định mỗi project có database riêng
            };

            // Insert project để có ID
            await _mongoContext.Projects.InsertOneAsync(project);

            // Nếu tenantMode là "separate", tạo database riêng
            if (project.TenantMode == "separate")
            {
                var dbName = _tenantDatabaseService.GenerateDatabaseName(project.Id);
                await _tenantDatabaseService.CreateSeparateDatabaseAsync(dbName);

                // Cập nhật lại project với DatabaseName
                var filter = Builders<Project>.Filter.Eq(p => p.Id, project.Id);
                var update = Builders<Project>.Update.Set(p => p.DatabaseName, dbName);
                await _mongoContext.Projects.UpdateOneAsync(filter, update);

                // Gán vào object để trả về
                project.DatabaseName = dbName;

                _logger.LogInformation("Created separate database '{DatabaseName}' for project '{ProjectId}'", dbName, project.Id);
            }

            var projectDto = new ProjectDTO
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                JsonData = project.JsonData,
                IsPublished = project.IsPublished,
                CreatedAt = project.CreatedAt
            };

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, projectDto);
        }

        // 4. PUT: api/projects/5 - Lưu/Cập nhật project (Dùng cho nút Save App)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(string id, CreateProjectDTO updateDto)
        {
            var userId = GetCurrentUserId();

            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
            );

            var project = await _mongoContext.Projects.Find(filter).FirstOrDefaultAsync();

            if (project == null) return NotFound();

            var update = Builders<Project>.Update
                .Set(p => p.Name, updateDto.Name)
                .Set(p => p.Description, updateDto.Description);
            
            // Quan trọng: Cập nhật JsonData (chứa cấu trúc của Canvas/App Builder)
            if (updateDto.JsonData != null)
            {
                update = update.Set(p => p.JsonData, updateDto.JsonData);
            }

            await _mongoContext.Projects.UpdateOneAsync(filter, update);

            return NoContent();
        }

        // 5. DELETE: api/projects/5 - Xóa một project
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(string id)
        {
            var userId = GetCurrentUserId();

            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
            );

            var result = await _mongoContext.Projects.DeleteOneAsync(filter);

            if (result.DeletedCount == 0) return NotFound();

            return NoContent();
        }

        // --- API MỚI: PHÁT HÀNH (PUBLISH) PROJECT LÊN MARKETPLACE ---
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishProject(string id, [FromBody] PublishAppDTO publishDto)
        {
            var userId = GetCurrentUserId();
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
            );
            var project = await _mongoContext.Projects.Find(filter).FirstOrDefaultAsync();

            if (project == null) return NotFound("Project not found.");

            // Cập nhật thông tin và đánh dấu là đã xuất bản (published)
            var update = Builders<Project>.Update
                .Set(p => p.Name, publishDto.Name)
                .Set(p => p.Description, publishDto.Description)
                .Set(p => p.IsPublished, true)
                .Set(p => p.Category, publishDto.Category)
                .Set(p => p.Price, publishDto.Price);

            await _mongoContext.Projects.UpdateOneAsync(filter, update);

            return Ok(new { message = "Project published successfully!", projectId = id });
        }
    }
}