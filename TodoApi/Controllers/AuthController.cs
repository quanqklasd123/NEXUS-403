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
using Google.Apis.Auth;

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
            // Bước 1: Kiểm tra xem email đã tồn tại chưa
            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
            {
                return BadRequest(new { message = "Email already in use" });
            }

            // Bước 2: Tạo đối tượng AppUser mới
            var user = new AppUser
            {
                Email = registerDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(), // Bắt buộc phải có
                UserName = registerDto.Username
            };

            // Bước 3: Dùng UserManager để tạo user (đã bao gồm hash mật khẩu)
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                // Trả về lỗi nếu không thành công (ví dụ: mật khẩu yếu)
                return BadRequest(new { message = "User creation failed", errors = result.Errors });
            }

            // Bước 4: Tự động gán vai trò "User" cho người dùng mới
            await _userManager.AddToRoleAsync(user, "User");
            // ---------------------

            return Ok(new { message = "User created successfully!" });
        }

        // --- THÊM HÀM MỚI ĐỂ TẠO TÀI KHOẢN ADMIN ---
        // POST: api/auth/create-admin
        [HttpPost]
        [Route("create-admin")]
        // [Authorize] // Bạn có thể thêm [Authorize(Roles = "Admin")] sau này để bảo mật
        public async Task<IActionResult> CreateAdminAccount([FromBody] RegisterRequestDTO adminDto)
        {
            // Bước 1: Kiểm tra xem tài khoản admin đã tồn tại chưa
            var userExists = await _userManager.FindByEmailAsync(adminDto.Email);
            if (userExists != null)
            {
                return BadRequest(new { message = "Email already in use" });
            }

            // Bước 2: Tạo đối tượng tài khoản Admin
            var adminUser = new AppUser
            {
                Email = adminDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = adminDto.Username
            };

            // Bước 3: Tạo user với mật khẩu
            var result = await _userManager.CreateAsync(adminUser, adminDto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Admin creation failed", errors = result.Errors });
            }

            // Bước 4: Gán cả hai vai trò "Admin" và "User"
            // (Gán "User" để Admin cũng có thể thực hiện các hành động của user thông thường)
            await _userManager.AddToRoleAsync(adminUser, "User");
            await _userManager.AddToRoleAsync(adminUser, "Admin");

            return Ok(new { message = "Admin account created successfully!" });
        }

        // POST: api/auth/login
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO loginDto)
        {
            // --- CHỈ TÌM KIẾM NGƯỜI DÙNG BẰNG EMAIL ---
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            // -----------------------------------------

            // Kiểm tra thông tin user và mật khẩu
            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                // Kiểm tra xem user có bị khóa không
                if (user.LockoutEnabled && user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
                {
                    return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
                }

                // Nếu thông tin đăng nhập đúng, tạo JWT Token
                var tokenString = await GenerateJwtToken(user); // (Sử dụng hàm GenerateJwtToken bên dưới)

                // Trả về Token cho phía client
                return Ok(new AuthResponseDTO
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Token = tokenString
                });
            }

            // Nếu thông tin đăng nhập sai, trả về lỗi "Unauthorized"
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // POST: api/auth/google-login
        [HttpPost]
        [Route("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDTO googleDto)
        {
            try
            {
                // Bước 1: Xác thực Google token
                var clientId = _configuration["GoogleAuth:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    return BadRequest(new { message = "Google Client ID not configured" });
                }

                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                };

                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(googleDto.IdToken, settings);
                }
                catch (InvalidJwtException ex)
                {
                    return Unauthorized(new { message = "Invalid Google token", details = ex.Message });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { message = "Error validating Google token", error = ex.Message });
                }

                // Kiểm tra xem có email trong payload Google hay không
                if (string.IsNullOrEmpty(payload.Email))
                {
                    return BadRequest(new { message = "Google token does not contain email" });
                }

                // Bước 2: Tìm kiếm hoặc tạo mới user
                var user = await _userManager.FindByEmailAsync(payload.Email);
                
                if (user == null)
                {
                    // Tạo tài khoản mới nếu user chưa tồn tại trong hệ thống
                    // Tạo UserName từ phần trước @ của email hoặc từ tên Google
                    var baseUserName = payload.Email?.Split('@')[0] ?? payload.Name?.Replace(" ", "") ?? "user";
                    // Loại bỏ các ký tự đặc biệt không hợp lệ, chỉ giữ chữ, số và gạch dưới
                    baseUserName = System.Text.RegularExpressions.Regex.Replace(baseUserName ?? "", @"[^a-zA-Z0-9_]", "");
                    if (string.IsNullOrEmpty(baseUserName))
                    {
                        baseUserName = "user";
                    }
                    
                    var userName = baseUserName;
                    var userNameCounter = 1;
                    
                    // Đảm bảo UserName là duy nhất - kiểm tra với normalized name (chữ hoa)
                    var normalizedUserName = userName.ToUpperInvariant();
                    var existingUserByName = await _userManager.FindByNameAsync(normalizedUserName);
                    while (existingUserByName != null && userNameCounter < 100)
                    {
                        userName = $"{baseUserName}{userNameCounter}";
                        normalizedUserName = userName.ToUpperInvariant();
                        existingUserByName = await _userManager.FindByNameAsync(normalizedUserName);
                        userNameCounter++;
                    }
                    
                    // Tạo mật khẩu ngẫu nhiên mạnh (sẽ không bao giờ được sử dụng để đăng nhập)
                    // Password phải đáp ứng yêu cầu bảo mật: ít nhất 6 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
                    var randomPassword = Guid.NewGuid().ToString().Replace("-", "") + "!@#$%^&*()ABCDEFG123456789";
                    
                    user = new AppUser
                    {
                        Email = payload.Email,
                        UserName = userName,
                        NormalizedUserName = normalizedUserName,
                        NormalizedEmail = payload.Email.ToUpperInvariant(),
                        SecurityStamp = Guid.NewGuid().ToString(),
                        EmailConfirmed = true, // Email đã được Google xác thực rồi
                        ConcurrencyStamp = Guid.NewGuid().ToString()
                    };

                    var createResult = await _userManager.CreateAsync(user, randomPassword);
                    if (!createResult.Succeeded)
                    {
                        // Trả về chi tiết lỗi để debug và khắc phục
                        var errorMessages = createResult.Errors.Select(e => $"{e.Code}: {e.Description}").ToList();
                        Console.WriteLine($"Failed to create user: {string.Join(", ", errorMessages)}");
                        Console.WriteLine($"Email: {payload.Email}, UserName: {userName}");
                        return BadRequest(new { 
                            message = "Failed to create user", 
                            errors = errorMessages,
                            details = createResult.Errors.Select(e => new { e.Code, e.Description }).ToList()
                        });
                    }

                    // Gán vai trò mặc định "User" cho tài khoản vừa tạo
                    await _userManager.AddToRoleAsync(user, "User");
                }
                else
                {
                    // Kiểm tra xem user có bị khóa không
                    if (user.LockoutEnabled && user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
                    {
                        return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
                    }
                }

                // Bước 3: Tạo JWT token để trả về cho client
                var tokenString = await GenerateJwtToken(user);

                return Ok(new AuthResponseDTO
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Token = tokenString
                });
            }
            catch (Exception ex)
            {
                // Ghi log chi tiết lỗi để debug và khắc phục sự cố
                Console.WriteLine($"Google login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Error processing Google login", error = ex.Message, details = ex.StackTrace });
            }
        }

        // GET: api/auth/me - Lấy thông tin người dùng hiện tại và các vai trò
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

        // --- Hàm riêng tư để tạo JWT Token ---
        private async Task<string> GenerateJwtToken(AppUser user)
        {
            // Lấy khóa bí mật (Secret Key) và các cấu hình từ file appsettings.json
            var jwtConfig = _configuration.GetSection("JwtConfig");
            var secretKey = jwtConfig["Secret"];
            var issuer = jwtConfig["Issuer"];
            var audience = jwtConfig["Audience"];

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // --- BẮT ĐẦU PHẦN QUAN TRỌNG: THÊM ROLES VÀO TOKEN ---

            // Bước 1: Lấy danh sách các vai trò (Roles) của user từ Identity
            var userRoles = await _userManager.GetRolesAsync(user);

            // Bước 2: Định nghĩa các "Claims" - các thông tin sẽ được mã hóa trong Token
            // Bắt đầu với các claims cơ bản (ID, Email, Username)
            var authClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty)
            };

            // Bước 3: Thêm tất cả các vai trò vào claims
            // Sử dụng ClaimTypes.Role để ASP.NET Core tự động nhận diện và xử lý
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }
            // --- KẾT THÚC PHẦN THÊM ROLES ---

            // Tạo JWT Token với các claims đã chuẩn bị
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                expires: DateTime.Now.AddHours(24),
                claims: authClaims, // <-- Sử dụng danh sách claims đã cập nhật với roles
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

            // Chuyển đổi token object thành chuỗi string để trả về
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}