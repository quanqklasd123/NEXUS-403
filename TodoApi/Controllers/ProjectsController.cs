using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập
    public class ProjectsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(MongoDbContext mongoContext, ILogger<ProjectsController> logger)
        {
            _mongoContext = mongoContext;
            _logger = logger;
        }

        // Hàm helper lấy UserId hiện tại
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // 1. GET: api/projects (Lấy danh sách của tôi)
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

        // 2. GET: api/projects/5 (Lấy chi tiết 1 project)
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

        // 3. POST: api/projects (Tạo mới)
        [HttpPost]
        public async Task<ActionResult<ProjectDTO>> PostProject(CreateProjectDTO createDto)
        {
            var userId = GetCurrentUserId();

            var project = new Project
            {
                Name = createDto.Name,
                Description = createDto.Description,
                JsonData = createDto.JsonData ?? "[]", // Mặc định là mảng rỗng
                AppUserId = userId,
                CreatedAt = DateTime.UtcNow,
                IsPublished = false
            };

            await _mongoContext.Projects.InsertOneAsync(project);

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

        // 4. PUT: api/projects/5 (Lưu/Cập nhật - Dùng cho nút Save App)
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
            
            // Quan trọng: Cập nhật JsonData (cấu trúc Canvas)
            if (updateDto.JsonData != null)
            {
                update = update.Set(p => p.JsonData, updateDto.JsonData);
            }

            await _mongoContext.Projects.UpdateOneAsync(filter, update);

            return NoContent();
        }

        // 5. DELETE: api/projects/5 (Xóa)
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

        // --- API MỚI: PUBLISH ---
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

            // Cập nhật thông tin và đánh dấu đã xuất bản
            var update = Builders<Project>.Update
                .Set(p => p.Name, publishDto.Name)
                .Set(p => p.Description, publishDto.Description)
                .Set(p => p.IsPublished, true);

            await _mongoContext.Projects.UpdateOneAsync(filter, update);

            return Ok(new { message = "Project published successfully!", projectId = id });
        }
    }
}