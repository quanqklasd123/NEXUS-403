// TodoApi/Controllers/DashboardController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using TodoApi.Data;
using TodoApi.Dtos; // <-- Import DTO mới

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Chỉ người đã đăng nhập mới được xem
    public class DashboardController : ControllerBase
    {
        private readonly TodoContext _context;

        public DashboardController(TodoContext context)
        {
            _context = context;
        }

        // Hàm helper để lấy UserId (giống các controller khác)
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // GET: api/dashboard/stats
        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStatsDTO>> GetDashboardStats()
        {
            var userId = GetCurrentUserId();

            // 1. Đếm tổng số List (thuộc về user này)
            var totalLists = await _context.TodoLists
                .Where(list => list.AppUserId == userId)
                .CountAsync();

            // 2. Đếm tổng số Task (chỉ trong các List thuộc về user này)
            var totalTasks = await _context.TodoItems
                .Where(item => item.TodoList.AppUserId == userId)
                .CountAsync();

            // 3. Đếm số Task đã hoàn thành (tương tự)
            var completedTasks = await _context.TodoItems
                .Where(item => item.TodoList.AppUserId == userId && item.Status == 2) // Giả sử Status == 2 là "Đã hoàn thành"
                .CountAsync();

            // 4. Tạo DTO kết quả và trả về
            var stats = new DashboardStatsDTO
            {
                TotalLists = totalLists,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks
            };

            return Ok(stats);
        }
    }
}