using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketplaceController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;

        // Thêm biến _apps để lưu danh sách app động (giả lập)
        private static List<MarketplaceAppDTO> _apps = new List<MarketplaceAppDTO>();

        public MarketplaceController(MongoDbContext mongoContext)
        {
            _mongoContext = mongoContext;
        }
        // 1. CẬP NHẬT DỮ LIỆU MẪU: Thêm nhiều "Component" nhỏ
        private static readonly List<MarketplaceAppDTO> _staticComponents = new()
        {
             new() { Id = "101", Name = "DatePicker Pro", Description = "Advanced date picker", Category = "Component", Color = "blue", IsInstalled = false },
             new() { Id = "102", Name = "Chart.js Widget", Description = "Beautiful charts", Category = "Component", Color = "purple", IsInstalled = true },
             new() { Id = "103", Name = "Stripe Payment Btn", Description = "Secure payment button", Category = "Component", Color = "indigo", IsInstalled = false },
             new() { Id = "104", Name = "Rich Text Editor", Description = "WYSIWYG editor", Category = "Component", Color = "pink", IsInstalled = false },
             new() { Id = "105", Name = "User Avatar Stack", Description = "Display avatars", Category = "Component", Color = "orange", IsInstalled = true }
        };

        [HttpGet("apps")]
        public async Task<IActionResult> GetApps()
        {
            // 1. Lấy các Project đã Publish từ MongoDB
            var filter = Builders<Project>.Filter.Eq(p => p.IsPublished, true);
            var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
            var publishedProjects = await _mongoContext.Projects
                .Find(filter)
                .Sort(sort)
                .ToListAsync();

            // 2. Chuyển đổi Project -> MarketplaceAppDTO
            var marketplaceApps = publishedProjects.Select(p => new MarketplaceAppDTO
            {
                Id = p.Id, // MongoDB dùng string Id
                Name = p.Name,
                Description = p.Description ?? "No description",
                Category = "Template",
                Author = p.AppUserId, // Tạm thời hiện ID user
                Tags = new[] { "Community", "Template" },
                Downloads = "0",
                Rating = 0,
                Color = "sage",
                IsInstalled = false,
                Price = null
            }).ToList();

            // 3. Gộp với danh sách Component tĩnh
            var finalAppList = new List<MarketplaceAppDTO>();
            finalAppList.AddRange(marketplaceApps);
            finalAppList.AddRange(_staticComponents);

            return Ok(finalAppList);
        }

        // GET: api/marketplace/my-components (CHO TRANG APP BUILDER)
        // API này chỉ trả về các "Component" đã được "Install"
        [HttpGet("my-components")]
        public IActionResult GetMyInstalledComponents()
        {
             // Vẫn trả về component tĩnh đã cài
             var myComponents = _staticComponents.Where(a => a.IsInstalled).ToList();
             return Ok(myComponents);
        }

        // POST: api/marketplace/install/{id} (Xử lý cài đặt)
        [HttpPost("install/{id}")]
        public IActionResult InstallApp(string id)
        {
            var app = _apps.FirstOrDefault(a => a.Id == id);
            if (app == null) return NotFound("Item not found");

            app.IsInstalled = true; // Đánh dấu là đã cài
            return Ok(new { message = $"Installed {app.Name}", appId = app.Id });
        }

        // --- API MỚI: PUBLISH PROJECT LÊN MARKETPLACE ---
        // POST: api/marketplace/publish/{projectId}
        [HttpPost("publish/{projectId}")]
        public async Task<IActionResult> PublishProject(string projectId, [FromBody] PublishAppDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1. Tìm Project gốc trong MongoDB của user
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, projectId),
                Builders<Project>.Filter.Eq(p => p.AppUserId, userId)
            );
            var project = await _mongoContext.Projects.Find(filter).FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound("Project not found or you don't own it.");
            }

            // 2. Cập nhật trạng thái IsPublished của Project
            var update = Builders<Project>.Update.Set(p => p.IsPublished, true);
            await _mongoContext.Projects.UpdateOneAsync(filter, update);

            // 3. Tạo một "App" mới trên Marketplace (Giả lập)
            // Trong thực tế, bạn sẽ lưu vào bảng 'MarketplaceApps' riêng
            var newMarketplaceApp = new MarketplaceAppDTO
            {
                Id = projectId, // Dùng projectId làm marketplaceId
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Author = "Me",
                Tags = new[] { "New", dto.Category },
                Downloads = "0",
                Rating = 0,
                Color = "sage",
                IsInstalled = true,
                Price = string.IsNullOrEmpty(dto.Price) ? null : dto.Price
            };

            // Thêm vào danh sách chợ
            _apps.Add(newMarketplaceApp);

            return Ok(new { message = "Published successfully!", marketplaceId = projectId });
        }
    }
}