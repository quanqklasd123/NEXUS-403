// Controllers/AdminController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TodoApi.Models;
using TodoApi.Models.MongoIdentity;
using TodoApi.Data;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<Models.MongoIdentity.AppUser> _userManager;
        private readonly MongoDbContext _mongoContext;
        
        public AdminController(UserManager<Models.MongoIdentity.AppUser> userManager, MongoDbContext mongoContext)
        {
            _userManager = userManager;
            _mongoContext = mongoContext;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                // Debug: Kiểm tra claims của user hiện tại
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;
                var currentUserRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
                
                // Log để debug (có thể xóa sau)
                Console.WriteLine($"Current User ID: {currentUserId}");
                Console.WriteLine($"Current User Roles from token: {string.Join(", ", currentUserRoles)}");
                
                // Lấy tất cả user từ MongoDB trực tiếp (vì UserManager.Users có thể không hoạt động với custom store)
                var usersList = await _mongoContext.Users.Find(_ => true).ToListAsync();

                // "Map" thủ công sang một đối tượng an toàn
                // (Tuyệt đối không trả về PasswordHash!)
                var usersDto = new List<object>();
                foreach (var user in usersList)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    usersDto.Add(new
                    {
                        Id = user.Id,
                        UserName = user.UserName,
                        Email = user.Email,
                        IsLocked = user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow,
                        LockoutEnd = user.LockoutEnd,
                        LockoutEnabled = user.LockoutEnabled,
                        Roles = roles.ToList()
                    });
                }

                return Ok(usersDto);
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                Console.WriteLine($"Error in GetUsers: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error loading users", error = ex.Message });
            }
        }

        // --- API QUẢN LÝ MARKETPLACE APPS ---
        // GET: api/admin/marketplace-apps
        [HttpGet("marketplace-apps")]
        public async Task<IActionResult> GetMarketplaceApps()
        {
            var filter = Builders<Project>.Filter.Eq(p => p.IsPublished, true);
            var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
            var publishedProjects = await _mongoContext.Projects
                .Find(filter)
                .Sort(sort)
                .ToListAsync();

            // Get user info from Identity (SQL Server)
            var projectsDto = new List<object>();
            foreach (var p in publishedProjects)
            {
                var user = await _userManager.FindByIdAsync(p.AppUserId);
                projectsDto.Add(new
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    AuthorId = p.AppUserId,
                    AuthorName = user?.UserName ?? "Unknown",
                    AuthorEmail = user?.Email ?? "Unknown"
                });
            }

            return Ok(projectsDto);
        }

        // DELETE: api/admin/marketplace-apps/{id}
        [HttpDelete("marketplace-apps/{id}")]
        public async Task<IActionResult> DeleteMarketplaceApp(string id)
        {
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.IsPublished, true)
            );

            var result = await _mongoContext.Projects.DeleteOneAsync(filter);

            if (result.DeletedCount == 0)
            {
                return NotFound("App không tồn tại hoặc chưa được publish.");
            }

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

        // POST: api/admin/fix-roles - Fix roles case cho tất cả users
        [HttpPost("fix-roles")]
        public async Task<IActionResult> FixRolesCase()
        {
            // Lấy users trực tiếp từ MongoDB
            var usersList = await _mongoContext.Users.Find(_ => true).ToListAsync();
            int fixedCount = 0;

            foreach (var user in usersList)
            {
                var roles = user.Roles.ToList();
                bool needsUpdate = false;

                // Fix roles case
                for (int i = 0; i < roles.Count; i++)
                {
                    var role = roles[i];
                    string fixedRole = role?.ToUpperInvariant() switch
                    {
                        "ADMIN" => "Admin",
                        "USER" => "User",
                        _ => role
                    };

                    if (role != fixedRole)
                    {
                        roles[i] = fixedRole;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate)
                {
                    user.Roles = roles;
                    await _userManager.UpdateAsync(user);
                    fixedCount++;
                }
            }

            return Ok(new { message = $"Đã sửa roles cho {fixedCount} users", fixedCount });
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
            if (roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("ADMIN", StringComparison.OrdinalIgnoreCase)))
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

        // PUT: api/admin/users/{id}/roles
        [HttpPut("users/{id}/roles")]
        public async Task<IActionResult> UpdateUserRoles(string id, [FromBody] List<string> newRoles)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Validate roles
            var validRoles = new[] { "User", "Admin" };
            if (newRoles.Any(r => !validRoles.Contains(r, StringComparer.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "Roles không hợp lệ. Chỉ chấp nhận 'User' và 'Admin'." });
            }

            // Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Remove all current roles
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(new { message = "Không thể xóa roles hiện tại.", errors = removeResult.Errors });
                }
            }

            // Add new roles
            if (newRoles.Any())
            {
                var addResult = await _userManager.AddToRolesAsync(user, newRoles);
                if (!addResult.Succeeded)
                {
                    return BadRequest(new { message = "Không thể thêm roles mới.", errors = addResult.Errors });
                }
            }

            return Ok(new { message = "Đã cập nhật roles thành công.", roles = newRoles });
        }
    }
}