// Controllers/AdminController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using System.Linq;

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

        public AdminController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
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
                Email = user.Email
            }).ToList();

            return Ok(usersDto);
        }

        // Bạn có thể thêm các API Admin khác ở đây...
        // ví dụ: Xóa user, xem thống kê, v.v.
    }
}