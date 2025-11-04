// Dtos/AuthRequestDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    public class RegisterRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class LoginRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}