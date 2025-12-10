// Controllers/AuthController.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TodoApi.Dtos;
using TodoApi.Models.MongoIdentity;
using System.Threading.Tasks;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<AppUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // POST: api/auth/register
        [HttpPost]
        [Route("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDTO registerDto)
        {
            // 1. Kiểm tra xem email đã tồn tại chưa
            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
            {
                return BadRequest(new { message = "Email already in use" });
            }

            // 2. Tạo đối tượng AppUser mới
            var user = new AppUser
            {
                Email = registerDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(), // Bắt buộc
                UserName = registerDto.Username
            };

            // 3. Dùng UserManager để tạo user (đã bao gồm hash mật khẩu)
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                // Trả về lỗi nếu không thành công (ví dụ: mật khẩu yếu)
                return BadRequest(new { message = "User creation failed", errors = result.Errors });
            }

            // 4. Tự động gán vai trò "User" cho người dùng mới
            await _userManager.AddToRoleAsync(user, "User");
            // ---------------------

            return Ok(new { message = "User created successfully!" });
        }

        // --- THÊM HÀM MỚI ĐỂ TẠO ADMIN ---
        // POST: api/auth/create-admin
        [HttpPost]
        [Route("create-admin")]
        // [Authorize] // Bạn có thể thêm [Authorize(Roles = "Admin")] sau này
        public async Task<IActionResult> CreateAdminAccount([FromBody] RegisterRequestDTO adminDto)
        {
            // 1. Kiểm tra xem admin đã tồn tại chưa
            var userExists = await _userManager.FindByEmailAsync(adminDto.Email);
            if (userExists != null)
            {
                return BadRequest(new { message = "Email already in use" });
            }

            // 2. Tạo đối tượng Admin
            var adminUser = new AppUser
            {
                Email = adminDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = adminDto.Username
            };

            // 3. Tạo user với mật khẩu
            var result = await _userManager.CreateAsync(adminUser, adminDto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Admin creation failed", errors = result.Errors });
            }

            // 4. Gán cả hai vai trò "Admin" và "User"
            // (Gán "User" để Admin cũng có thể làm các hành động của user)
            await _userManager.AddToRoleAsync(adminUser, "User");
            await _userManager.AddToRoleAsync(adminUser, "Admin");

            return Ok(new { message = "Admin account created successfully!" });
        }

        // POST: api/auth/login
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO loginDto)
        {
            // --- CHỈ TÌM BẰNG EMAIL ---
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            // -------------------------

            // Kiểm tra user và mật khẩu
            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                // Kiểm tra xem user có bị khóa không
                if (user.LockoutEnabled && user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
                {
                    return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
                }

                // Nếu đúng, tạo Token
                var tokenString = await GenerateJwtToken(user); // (Giữ nguyên hàm GenerateJwtToken)

                // Trả về Token cho client
                return Ok(new AuthResponseDTO
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Token = tokenString
                });
            }

            // Nếu sai, trả về lỗi "Unauthorized"
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // GET: api/auth/me - Lấy thông tin user hiện tại và roles
        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            return Ok(new
            {
                UserId = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                Roles = roles,
                Claims = claims,
                IsAdmin = roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("ADMIN", StringComparison.OrdinalIgnoreCase))
            });
        }

        // --- Hàm Private để tạo Token ---
        private async Task<string> GenerateJwtToken(AppUser user)
        {
            // Lấy "chìa khóa bí mật" và các cấu hình từ appsettings.json
            var jwtConfig = _configuration.GetSection("JwtConfig");
            var secretKey = jwtConfig["Secret"];
            var issuer = jwtConfig["Issuer"];
            var audience = jwtConfig["Audience"];

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // --- BẮT ĐẦU THAY ĐỔI QUAN TRỌNG ---

            // 1. Lấy danh sách Vai trò (Roles) của user
            var userRoles = await _userManager.GetRolesAsync(user);

            // 2. Định nghĩa các "Claims" - thông tin chứa trong Token
            // Bắt đầu với các claims cơ bản
            var authClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty)
            };

            // 3. Thêm các Role vào claims
            // Sử dụng ClaimTypes.Role để ASP.NET Core có thể đọc được
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }
            // --- KẾT THÚC THAY ĐỔI ---

            // Tạo Token
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                expires: DateTime.Now.AddHours(24),
                claims: authClaims, // <-- Dùng danh sách claims đã cập nhật
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

            // Ghi token ra dạng chuỗi
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}