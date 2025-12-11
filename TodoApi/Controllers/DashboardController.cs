// TodoApi/Controllers/DashboardController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;

        public DashboardController(MongoDbContext mongoContext)
        {
            _mongoContext = mongoContext;
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
            var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId);
            var totalLists = (int)await _mongoContext.TodoLists.CountDocumentsAsync(listFilter);

            // 2. Lấy tất cả listIds của user
            var userLists = await _mongoContext.TodoLists.Find(listFilter).ToListAsync();
            var listIds = userLists.Select(l => l.Id).ToList();

            // 3. Đếm tổng số Task (chỉ trong các List thuộc về user này)
            var itemFilter = Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds);
            var totalTasks = (int)await _mongoContext.TodoItems.CountDocumentsAsync(itemFilter);

            // 4. Đếm số Task đã hoàn thành (Status == 2)
            var completedFilter = Builders<TodoItem>.Filter.And(
                Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds),
                Builders<TodoItem>.Filter.Eq(item => item.Status, 2)
            );
            var completedTasks = (int)await _mongoContext.TodoItems.CountDocumentsAsync(completedFilter);

            // 5. Tạo DTO kết quả và trả về
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