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
    [Authorize] // Bắt buộc đăng nhập
    public class ProjectsController : ControllerBase
    {
        private readonly TodoContext _context;

        public ProjectsController(TodoContext context)
        {
            _context = context;
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
            var userId = GetCurrentUserId();

            var projects = await _context.Projects
                .Where(p => p.AppUserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProjectDTO // Map thủ công sang DTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    JsonData = p.JsonData,
                    IsPublished = p.IsPublished,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(projects);
        }

        // 2. GET: api/projects/5 (Lấy chi tiết 1 project)
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDTO>> GetProject(long id)
        {
            var userId = GetCurrentUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.AppUserId == userId);

            if (project == null) return NotFound();

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

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

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
        public async Task<IActionResult> PutProject(long id, CreateProjectDTO updateDto)
        {
            var userId = GetCurrentUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.AppUserId == userId);

            if (project == null) return NotFound();

            project.Name = updateDto.Name;
            project.Description = updateDto.Description;
            
            // Quan trọng: Cập nhật JsonData (cấu trúc Canvas)
            if (updateDto.JsonData != null)
            {
                project.JsonData = updateDto.JsonData;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw;
            }

            return NoContent();
        }

        // 5. DELETE: api/projects/5 (Xóa)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(long id)
        {
            var userId = GetCurrentUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.AppUserId == userId);

            if (project == null) return NotFound();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // --- API MỚI: PUBLISH ---
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishProject(long id, [FromBody] PublishAppDTO publishDto)
        {
            var userId = GetCurrentUserId();
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id && p.AppUserId == userId);

            if (project == null) return NotFound("Project not found.");

            // Cập nhật thông tin và đánh dấu đã xuất bản
            project.Name = publishDto.Name;
            project.Description = publishDto.Description;
            project.IsPublished = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Project published successfully!", projectId = project.Id });
        }
    }
}