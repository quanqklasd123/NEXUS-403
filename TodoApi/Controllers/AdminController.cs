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
                // Debug: Kiểm tra các claims (thông tin xác thực) của user hiện tại
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;
                var currentUserRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
                
                // Ghi log để debug (có thể xóa sau khi hoàn thành)
                Console.WriteLine($"Current User ID: {currentUserId}");
                Console.WriteLine($"Current User Roles from token: {string.Join(", ", currentUserRoles)}");
                
                // Lấy tất cả người dùng từ MongoDB trực tiếp (vì UserManager.Users có thể không hoạt động với custom store)
                var usersList = await _mongoContext.Users.Find(_ => true).ToListAsync();

                // Chuyển đổi ("Map") thủ công sang đối tượng an toàn để trả về
                // (TUYỆT ĐỐI KHÔNG trả về PasswordHash cho client vì lý do bảo mật!)
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
                // Ghi log lỗi chi tiết để phục vụ debug và khắc phục
                Console.WriteLine($"Error in GetUsers: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error loading users", error = ex.Message });
            }
        }

        // --- API QUẢN LÝ CÁC ỨNG DỤNG TRÊN MARKETPLACE ---
        // GET: api/admin/marketplace-apps - Lấy danh sách tất cả apps đã publish
        [HttpGet("marketplace-apps")]
        public async Task<IActionResult> GetMarketplaceApps()
        {
            var filter = Builders<Project>.Filter.Eq(p => p.IsPublished, true);
            var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
            var publishedProjects = await _mongoContext.Projects
                .Find(filter)
                .Sort(sort)
                .ToListAsync();

            // Lấy thông tin user (tác giả) từ hệ thống Identity
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

        // DELETE: api/admin/marketplace-apps/{id} - Gỡ app khỏi marketplace
        [HttpDelete("marketplace-apps/{id}")]
        public async Task<IActionResult> DeleteMarketplaceApp(string id)
        {
            // Thay vì xóa hoàn toàn, chỉ unpublish app để ẩn khỏi marketplace
            // Cách này bảo toàn app gốc và tất cả bản copy mà users đã cài đặt
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.IsPublished, true)
            );

            var update = Builders<Project>.Update.Set(p => p.IsPublished, false);
            var result = await _mongoContext.Projects.UpdateOneAsync(filter, update);

            if (result.MatchedCount == 0)
            {
                return NotFound("App không tồn tại hoặc chưa được publish.");
            }

            return Ok(new { message = "Đã ẩn app khỏi marketplace thành công. App vẫn tồn tại trong My Apps của users đã cài." });
        }

        // --- API QUẢN LÝ NGƯỜI DÙNG ---
        // PUT: api/admin/users/{id}/lock - Khóa tài khoản user
        [HttpPut("users/{id}/lock")]
        public async Task<IActionResult> LockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Khóa tài khoản user vĩnh viễn (đặt LockoutEnd vào thời điểm rất xa trong tương lai)
            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
            
            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Đã khóa user thành công." });
            }

            return BadRequest(new { message = "Không thể khóa user.", errors = result.Errors });
        }

        // PUT: api/admin/users/{id}/unlock - Mở khóa tài khoản user
        [HttpPut("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Mở khóa tài khoản user (cho phép đăng nhập lại)
            user.LockoutEnd = null;
            
            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "Đã mở khóa user thành công." });
            }

            return BadRequest(new { message = "Không thể mở khóa user.", errors = result.Errors });
        }

        // POST: api/admin/fix-roles - Sửa chữa định dạng roles cho tất cả users
        [HttpPost("fix-roles")]
        public async Task<IActionResult> FixRolesCase()
        {
            // Lấy danh sách users trực tiếp từ MongoDB
            var usersList = await _mongoContext.Users.Find(_ => true).ToListAsync();
            int fixedCount = 0;

            foreach (var user in usersList)
            {
                var roles = user.Roles.ToList();
                bool needsUpdate = false;

                // Chuẩn hóa định dạng chữ hoa/thường cho roles
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

        // DELETE: api/admin/users/{id} - Xóa tài khoản user
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Kiểm tra xem user có phải là Admin không (không cho phép xóa Admin để bảo vệ hệ thống)
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

        // PUT: api/admin/users/{id}/roles - Cập nhật vai trò của user
        [HttpPut("users/{id}/roles")]
        public async Task<IActionResult> UpdateUserRoles(string id, [FromBody] List<string> newRoles)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // Kiểm tra tính hợp lệ của roles (chỉ cho phép 'User' và 'Admin')
            var validRoles = new[] { "User", "Admin" };
            if (newRoles.Any(r => !validRoles.Contains(r, StringComparer.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "Roles không hợp lệ. Chỉ chấp nhận 'User' và 'Admin'." });
            }

            // Lấy danh sách roles hiện tại của user
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Xóa tất cả các roles hiện tại trước khi thêm roles mới
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(new { message = "Không thể xóa roles hiện tại.", errors = removeResult.Errors });
                }
            }

            // Thêm các roles mới vào tài khoản user
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