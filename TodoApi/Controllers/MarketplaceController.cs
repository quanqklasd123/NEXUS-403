using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.Dtos;

// ... (các using giữ nguyên)

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketplaceController : ControllerBase
    {
        // 1. CẬP NHẬT DỮ LIỆU MẪU: Thêm nhiều "Component" nhỏ
        private static readonly List<MarketplaceAppDTO> _apps = new()
        {
            // App lớn (Templates)
            new() { Id = 1, Name = "CRM Template", Description = "Full CRM system", Category = "Template", Color = "sage", IsInstalled = false },
            
            // Item nhỏ (Components) - ĐÂY LÀ CÁI BẠN MUỐN
            new() { Id = 101, Name = "DatePicker Pro", Description = "Advanced date picker with range select", Category = "Component", Color = "blue", IsInstalled = false },
            new() { Id = 102, Name = "Chart.js Widget", Description = "Beautiful line and bar charts", Category = "Component", Color = "purple", IsInstalled = true }, // Giả sử đã cài cái này
            new() { Id = 103, Name = "Stripe Payment Btn", Description = "Secure payment button component", Category = "Component", Color = "indigo", IsInstalled = false },
            new() { Id = 104, Name = "Rich Text Editor", Description = "WYSIWYG editor for content", Category = "Component", Color = "pink", IsInstalled = false },
            new() { Id = 105, Name = "User Avatar Stack", Description = "Display team members avatars", Category = "Component", Color = "orange", IsInstalled = true } // Giả sử đã cài
        };

        // GET: api/marketplace/apps (Cho trang Marketplace)
        [HttpGet("apps")]
        public IActionResult GetApps()
        {
            return Ok(_apps);
        }

        // GET: api/marketplace/my-components (CHO TRANG APP BUILDER)
        // API này chỉ trả về các "Component" đã được "Install"
        [HttpGet("my-components")]
        public IActionResult GetMyInstalledComponents()
        {
            var myComponents = _apps
                .Where(a => a.Category == "Component" && a.IsInstalled)
                .ToList();
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

        // POST: api/marketplace/publish
        [HttpPost("publish")]
        public IActionResult PublishApp([FromBody] PublishAppDTO dto)
        {
            // 1. Tạo ID mới (lấy ID lớn nhất + 1)
            var newId = _apps.Max(a => a.Id) + 1;

            // 2. Tạo đối tượng App mới
            var newApp = new MarketplaceAppDTO
            {
                Id = newId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Author = "Me", // (Sau này sẽ lấy tên User từ Token)
                Tags = new[] { "New", dto.Category },
                Downloads = "0",
                Rating = 5.0,
                Color = "sage", // Mặc định màu xanh
                IsInstalled = true, // Vì mình tạo ra nó nên coi như đã cài
                Price = string.IsNullOrEmpty(dto.Price) ? null : dto.Price
            };

            // 3. Lưu vào "Kho" (List tạm thời)
            _apps.Add(newApp);

            return Ok(new { message = "App published successfully!", appId = newId });
        }
    }
}