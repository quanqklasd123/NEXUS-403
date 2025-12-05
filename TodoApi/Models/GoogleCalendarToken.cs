// Models/GoogleCalendarToken.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
    public class GoogleCalendarToken
    {
        [Key]
        public long Id { get; set; }

        [Required]
        [StringLength(450)]
        public string AppUserId { get; set; } = string.Empty;

        [Required]
        public string AccessToken { get; set; } = string.Empty;

        public string? RefreshToken { get; set; }

        [StringLength(50)]
        public string TokenType { get; set; } = "Bearer";

        [Required]
        public DateTime ExpiresAt { get; set; }

        public string? Scope { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("AppUserId")]
        public AppUser AppUser { get; set; } = null!;
    }
}

