// Controllers/AdminController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using TodoApi.AI;
using TodoApi.Data;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // --- ĐÂY LÀ PHÉP THUẬT ---
    // Chỉ những ai có Role "Admin" trong Token mới được vào Controller này
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AiModelService _aiModelService;
        private readonly TodoContext _context;
        
        public AdminController(UserManager<AppUser> userManager, AiModelService aiModelService, TodoContext context)
        {
            _userManager = userManager;
            _aiModelService = aiModelService;
            _context = context;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            // Lấy tất cả user từ CSDL
            var users = await _userManager.Users.ToListAsync();

            // "Map" thủ công sang một đối tượng an toàn
            // (Tuyệt đối không trả về PasswordHash!)
            var usersDto = users.Select(user => new
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                IsLocked = user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow,
                LockoutEnd = user.LockoutEnd,
                LockoutEnabled = user.LockoutEnabled,
                Roles = _userManager.GetRolesAsync(user).Result.ToList()
            }).ToList();

            return Ok(usersDto);
        }
        
        // --- THÊM API MỚI ĐỂ HUẤN LUYỆN ---
        // GET: api/admin/train-ai
        [HttpGet("train-ai")]
        public IActionResult TrainAiModel()
        {
            var result = _aiModelService.TrainAndSaveModel();

            if (result)
            {
                return Ok("Huấn luyện mô hình AI thành công! File 'model.zip' đã được tạo.");
            }
            else
            {
                return StatusCode(500, "Huấn luyện AI thất bại. Kiểm tra log.");
            }
        }

        // --- API QUẢN LÝ MARKETPLACE APPS ---
        // GET: api/admin/marketplace-apps
        [HttpGet("marketplace-apps")]
        public async Task<IActionResult> GetMarketplaceApps()
        {
            var publishedProjects = await _context.Projects
                .Where(p => p.IsPublished)
                .Include(p => p.AppUser)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    AuthorId = p.AppUserId,
                    AuthorName = p.AppUser.UserName,
                    AuthorEmail = p.AppUser.Email
                })
                .ToListAsync();

            return Ok(publishedProjects);
        }

        // DELETE: api/admin/marketplace-apps/{id}
        [HttpDelete("marketplace-apps/{id}")]
        public async Task<IActionResult> DeleteMarketplaceApp(long id)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);

            if (project == null)
            {
                return NotFound("App không tồn tại hoặc chưa được publish.");
            }

            // Xóa project (hoặc chỉ set IsPublished = false nếu muốn giữ lại)
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa app khỏi marketplace thành công." });
        }

        // --- API QUẢN LÝ USERS ---
        // PUT: api/admin/users/{id}/lock
        [HttpPut("users/{id}/lock")]
        public async Task<IActionResult> LockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Khóa user vĩnh viễn (set LockoutEnd vào tương lai xa)
            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
            
            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Đã khóa user thành công." });
            }

            return BadRequest(new { message = "Không thể khóa user.", errors = result.Errors });
        }

        // PUT: api/admin/users/{id}/unlock
        [HttpPut("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Mở khóa user
            user.LockoutEnd = null;
            
            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Đã mở khóa user thành công." });
            }

            return BadRequest(new { message = "Không thể mở khóa user.", errors = result.Errors });
        }

        // DELETE: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Kiểm tra xem user có phải Admin không (không cho xóa Admin)
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return BadRequest(new { message = "Không thể xóa tài khoản Admin." });
            }

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Đã xóa user thành công." });
            }

            return BadRequest(new { message = "Không thể xóa user.", errors = result.Errors });
        }
    }
}