// Dtos/AuthResponseDTO.cs
namespace TodoApi.Dtos
{
    // Đây là những gì chúng ta trả về sau khi đăng nhập thành công
    public class AuthResponseDTO
    {
        public string UserId { get; set; }
        public string Email { get; set; }
        public string Token { get; set; } // Chìa khóa truy cập
    }
}