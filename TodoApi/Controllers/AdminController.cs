// Controllers/AdminController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
using TodoApi.AI;

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
        public AdminController(UserManager<AppUser> userManager ,AiModelService aiModelService)
        {
            _userManager = userManager;
            _aiModelService = aiModelService;
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

        // Bạn có thể thêm các API Admin khác ở đây...
        // ví dụ: Xóa user, xem thống kê, v.v.
    }
}