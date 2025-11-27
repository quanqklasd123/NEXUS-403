using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Thêm
using System.Security.Claims; // Thêm
using TodoApi.Data; // Thêm
using TodoApi.Dtos;
using TodoApi.Models;

// ... (các using giữ nguyên)

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketplaceController : ControllerBase
    {
        private readonly TodoContext _context;

        // Thêm biến _apps để lưu danh sách app động (giả lập)
        private static List<MarketplaceAppDTO> _apps = new List<MarketplaceAppDTO>();

        // Cập nhật Constructor để nhận TodoContext
        public MarketplaceController(TodoContext context)
        {
            _context = context;
        }
        // 1. CẬP NHẬT DỮ LIỆU MẪU: Thêm nhiều "Component" nhỏ
        private static readonly List<MarketplaceAppDTO> _staticComponents = new()
        {
             new() { Id = 101, Name = "DatePicker Pro", Description = "Advanced date picker", Category = "Component", Color = "blue", IsInstalled = false },
             new() { Id = 102, Name = "Chart.js Widget", Description = "Beautiful charts", Category = "Component", Color = "purple", IsInstalled = true },
             new() { Id = 103, Name = "Stripe Payment Btn", Description = "Secure payment button", Category = "Component", Color = "indigo", IsInstalled = false },
             new() { Id = 104, Name = "Rich Text Editor", Description = "WYSIWYG editor", Category = "Component", Color = "pink", IsInstalled = false },
             new() { Id = 105, Name = "User Avatar Stack", Description = "Display avatars", Category = "Component", Color = "orange", IsInstalled = true }
        };

        [HttpGet("apps")]
        public async Task<IActionResult> GetApps()
        {
            // 1. Lấy các Project đã Publish từ DB
            var publishedProjects = await _context.Projects
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            // 2. Chuyển đổi Project -> MarketplaceAppDTO
            var marketplaceApps = publishedProjects.Select(p => new MarketplaceAppDTO
            {
                Id = (int)p.Id, // Ép kiểu long -> int (Lưu ý: MarketplaceAppDTO đang dùng int cho Id)
                Name = p.Name,
                Description = p.Description ?? "No description",
                Category = "Template", // Mặc định project user tạo là Template (hoặc bạn có thể lưu field Category vào Project)
                Author = p.AppUserId, // (Tạm thời hiện ID user, sau này join bảng User để lấy tên)
                Tags = new[] { "Community", "Template" },
                Downloads = "0", // Chưa có chức năng đếm download
                Rating = 0,      // Chưa có chức năng rating
                Color = "sage",  // Màu mặc định
                IsInstalled = false, // Logic install chưa làm thật
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
        public IActionResult InstallApp(int id)
        {
            var app = _apps.FirstOrDefault(a => a.Id == id);
            if (app == null) return NotFound("Item not found");

            app.IsInstalled = true; // Đánh dấu là đã cài
            return Ok(new { message = $"Installed {app.Name}", appId = app.Id });
        }

        // --- API MỚI: PUBLISH PROJECT LÊN MARKETPLACE ---
        // POST: api/marketplace/publish/{projectId}
        [HttpPost("publish/{projectId}")]
        public async Task<IActionResult> PublishProject(long projectId, [FromBody] PublishAppDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1. Tìm Project gốc trong DB của user
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId && p.AppUserId == userId);

            if (project == null)
            {
                return NotFound("Project not found or you don't own it.");
            }

            // 2. (Optional) Cập nhật trạng thái IsPublished của Project
            project.IsPublished = true;
            await _context.SaveChangesAsync();

            // 3. Tạo một "App" mới trên Marketplace (Giả lập)
            // Trong thực tế, bạn sẽ lưu vào bảng 'MarketplaceApps' riêng
            var newMarketplaceApp = new MarketplaceAppDTO
            {
                Id = _apps.Any() ? _apps.Max(a => a.Id) + 1 : 1, // Tạo ID mới
                Name = dto.Name, // Dùng tên mới người dùng nhập lúc publish
                Description = dto.Description,
                Category = dto.Category,
                Author = "Me", // (Lấy tên user thật nếu muốn)
                Tags = new[] { "New", dto.Category },
                Downloads = "0",
                Rating = 0,
                Color = "sage", // Mặc định màu
                IsInstalled = true, // Tác giả thì coi như đã cài
                Price = string.IsNullOrEmpty(dto.Price) ? null : dto.Price
            };

            // Thêm vào danh sách chợ
            _apps.Add(newMarketplaceApp);

            return Ok(new { message = "Published successfully!", marketplaceId = newMarketplaceApp.Id });
        }
    }
}