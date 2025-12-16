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

        public MarketplaceController(MongoDbContext mongoContext)
        {
            _mongoContext = mongoContext;
        }
           // NOTE: Static/fake components removed — marketplace will only return published Projects.

        [HttpGet("apps")]
        public async Task<IActionResult> GetApps([FromQuery] string? category = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            Console.WriteLine($"🔍 GetApps called with category: '{category}'");

            // 1. Lấy các Project đã Publish từ MongoDB
            var filter = Builders<Project>.Filter.Eq(p => p.IsPublished, true);
            
            // Filter theo category nếu có
            if (!string.IsNullOrEmpty(category) && category != "All")
            {
                Console.WriteLine($"📁 Filtering by category: '{category}'");
                filter = Builders<Project>.Filter.And(
                    filter,
                    Builders<Project>.Filter.Eq(p => p.Category, category)
                );
            }

            var sort = Builders<Project>.Sort.Descending(p => p.CreatedAt);
            var publishedProjects = await _mongoContext.Projects
                .Find(filter)
                .Sort(sort)
                .ToListAsync();

            Console.WriteLine($"✅ Found {publishedProjects.Count} published projects");
            foreach (var proj in publishedProjects)
            {
                Console.WriteLine($"   - {proj.Name} (Category: '{proj.Category}')");
            }

            // 2. Lấy danh sách Projects đã install để check IsInstalled (check Projects với MarketplaceAppId)
            var installedAppIds = new HashSet<string>();
            if (!string.IsNullOrEmpty(userId))
            {
                var installedProjectsFilter = Builders<Project>.Filter.And(
                    Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
                    Builders<Project>.Filter.Ne(p => p.MarketplaceAppId, null)
                );
                var installedProjects = await _mongoContext.Projects
                    .Find(installedProjectsFilter)
                    .Project(p => p.MarketplaceAppId)
                    .ToListAsync();
                installedAppIds = new HashSet<string>(installedProjects.Where(id => !string.IsNullOrEmpty(id)));
            }

            // 2.5. Tính số lượt install cho mỗi app (đếm số Projects có MarketplaceAppId trùng với app Id)
            var installCounts = new Dictionary<string, int>();
            foreach (var project in publishedProjects)
            {
                var installFilter = Builders<Project>.Filter.Eq(p => p.MarketplaceAppId, project.Id);
                var count = await _mongoContext.Projects.CountDocumentsAsync(installFilter);
                installCounts[project.Id] = (int)count;
            }

            // 2.6. Lấy thông tin username cho các author
            var authorIds = publishedProjects.Select(p => p.AppUserId).Distinct().ToList();
            var authorFilter = Builders<Models.MongoIdentity.AppUser>.Filter.In(u => u.Id, authorIds);
            var authors = await _mongoContext.Users.Find(authorFilter).ToListAsync();
            var authorDict = authors.ToDictionary(u => u.Id, u => u.UserName ?? "Anonymous");

            // 3. Chuyển đổi Project -> MarketplaceAppDTO
            var marketplaceApps = publishedProjects.Select(p => new MarketplaceAppDTO
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description ?? "No description",
                Category = p.Category ?? "Template",
                Author = authorDict.ContainsKey(p.AppUserId) ? authorDict[p.AppUserId] : "Anonymous",
                Tags = new[] { "Community", p.Category ?? "Template" },
                Downloads = installCounts.ContainsKey(p.Id) ? installCounts[p.Id].ToString() : "0",
                Rating = 0,
                Color = "sage",
                IsInstalled = installedAppIds.Contains(p.Id),
                Price = p.Price
            }).ToList();

            // Return only published projects (no static/fake apps)
            return Ok(marketplaceApps);
        }

        // GET: api/marketplace/apps/{id} - Xem chi tiết app (read-only)
        [HttpGet("apps/{id}")]
        public async Task<IActionResult> GetAppDetail(string id)
        {
            try
            {
                // Validate input
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new { message = "App ID is required" });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Tìm trong published projects
                var projectFilter = Builders<Project>.Filter.And(
                    Builders<Project>.Filter.Eq(p => p.Id, id),
                    Builders<Project>.Filter.Eq(p => p.IsPublished, true)
                );
                
                var project = await _mongoContext.Projects.Find(projectFilter).FirstOrDefaultAsync();

                if (project != null)
                {
                    // Check xem user đã install chưa (check Projects với MarketplaceAppId)
                    bool isInstalled = false;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        var installedFilter = Builders<Project>.Filter.And(
                            Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
                            Builders<Project>.Filter.Eq(p => p.MarketplaceAppId, id)
                        );
                        var installedProject = await _mongoContext.Projects.Find(installedFilter).FirstOrDefaultAsync();
                        isInstalled = installedProject != null;
                    }

                    // Tính số lượt install thực tế
                    var installCountFilter = Builders<Project>.Filter.Eq(p => p.MarketplaceAppId, id);
                    var installCount = await _mongoContext.Projects.CountDocumentsAsync(installCountFilter);

                    // Lấy username của author
                    var authorFilter = Builders<Models.MongoIdentity.AppUser>.Filter.Eq(u => u.Id, project.AppUserId);
                    var author = await _mongoContext.Users.Find(authorFilter).FirstOrDefaultAsync();
                    var authorName = author?.UserName ?? "Anonymous";

                    var appDto = new MarketplaceAppDTO
                    {
                        Id = project.Id,
                        Name = project.Name,
                        Description = project.Description ?? "No description",
                        Category = project.Category ?? "Template",
                        Author = authorName,
                        Tags = new[] { "Community", project.Category ?? "Template" },
                        Downloads = installCount.ToString(),
                        Rating = 0,
                        Color = "sage",
                        IsInstalled = isInstalled,
                        Price = project.Price,
                        JsonData = project.JsonData, // include the appbuilder JSON so preview can render
                        UpdatedAt = project.UpdatedAt
                    };
                    return Ok(appDto);
                }

                // If not found among published projects, return NotFound
                return NotFound(new { message = "App not found" });
            }
            catch (MongoException mongoEx)
            {
                return StatusCode(500, new { 
                    message = "Database error while retrieving app", 
                    error = mongoEx.Message 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error retrieving app details", 
                    error = ex.Message 
                });
            }
        }

        // GET: api/marketplace/my-components (CHO TRANG APP BUILDER)
        // Return installed components for the current user.
        // Previously this returned a set of static fake components; that behavior
        // has been removed. For now return an empty list (the App Builder will
        // use installed UserApps instead).
        [HttpGet("my-components")]
        public IActionResult GetMyInstalledComponents()
        {
            return Ok(new List<MarketplaceAppDTO>());
        }

        // POST: api/marketplace/install/{id} (Xử lý cài đặt - tạo Project từ marketplace app)
        [HttpPost("install/{id}")]
        public async Task<IActionResult> InstallApp(string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // 1. Tìm app trong published projects
            var projectFilter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, id),
                Builders<Project>.Filter.Eq(p => p.IsPublished, true)
            );
            var marketplaceProject = await _mongoContext.Projects.Find(projectFilter).FirstOrDefaultAsync();

            if (marketplaceProject == null)
            {
                return NotFound(new { message = "App not found in marketplace" });
            }

            // 2. Kiểm tra xem user đã install chưa (tìm Project với cùng MarketplaceAppId)
            var existingFilter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.AppUserId, userId),
                Builders<Project>.Filter.Eq(p => p.MarketplaceAppId, id)
            );
            var existingProject = await _mongoContext.Projects.Find(existingFilter).FirstOrDefaultAsync();

            if (existingProject != null)
            {
                return BadRequest(new { message = "App already installed" });
            }

            // 3. Tạo Project mới từ marketplace app (copy cho user)
            var newProject = new Project
            {
                Name = marketplaceProject.Name,
                Description = marketplaceProject.Description,
                JsonData = marketplaceProject.JsonData, // Copy toàn bộ cấu trúc app
                AppUserId = userId, // User hiện tại là owner
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsPublished = false, // App đã install không tự động publish
                Category = marketplaceProject.Category,
                Price = marketplaceProject.Price,
                MarketplaceAppId = id, // Lưu ID của app gốc từ marketplace
                OriginalAuthor = marketplaceProject.AppUserId // Lưu author gốc
            };

            await _mongoContext.Projects.InsertOneAsync(newProject);

            return Ok(new { message = $"Installed {marketplaceProject.Name} successfully", projectId = newProject.Id });
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

            // 1.5. Tự động tạo Category nếu chưa tồn tại
            if (!string.IsNullOrWhiteSpace(dto.Category))
            {
                var categoryFilter = Builders<Category>.Filter.Eq(c => c.Name, dto.Category);
                var existingCategory = await _mongoContext.Categories.Find(categoryFilter).FirstOrDefaultAsync();
                
                if (existingCategory == null)
                {
                    var newCategory = new Category
                    {
                        Name = dto.Category,
                        Description = $"Auto-created category for {dto.Category}",
                        Color = "sage",
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _mongoContext.Categories.InsertOneAsync(newCategory);
                }
            }

            // 2. Cập nhật trạng thái IsPublished và thông tin của Project
            var update = Builders<Project>.Update
                .Set(p => p.IsPublished, true)
                .Set(p => p.Category, dto.Category)
                .Set(p => p.Price, dto.Price);
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

            // Previously we kept a separate in-memory marketplace list; removed.

            return Ok(new { message = "Published successfully!", marketplaceId = projectId });
        }

        // --- CATEGORY APIs ---
        // GET: api/marketplace/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _mongoContext.Categories
                .Find(_ => true)
                .SortBy(c => c.Name)
                .ToListAsync();

            var categoryDtos = categories.Select(c => new CategoryDTO
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Color = c.Color,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy
            }).ToList();

            return Ok(categoryDtos);
        }

        // POST: api/marketplace/categories
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Kiểm tra category đã tồn tại chưa
            var existingFilter = Builders<Category>.Filter.Eq(c => c.Name, dto.Name);
            var existing = await _mongoContext.Categories.Find(existingFilter).FirstOrDefaultAsync();
            if (existing != null)
            {
                return BadRequest(new { message = "Category already exists" });
            }

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                Color = dto.Color ?? "sage",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _mongoContext.Categories.InsertOneAsync(category);

            var categoryDto = new CategoryDTO
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Color = category.Color,
                CreatedAt = category.CreatedAt,
                CreatedBy = category.CreatedBy
            };

            return CreatedAtAction(nameof(GetCategories), categoryDto);
        }
    }
}