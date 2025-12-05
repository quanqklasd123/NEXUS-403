using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
    /// <summary>
    /// UserApp - Represents an app owned by a user (created from App Builder or downloaded from Marketplace)
    /// </summary>
    public class UserApp
    {
        public long Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = "Untitled App";

        [StringLength(50)]
        public string Icon { get; set; } = "📱";

        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// JSON config storing all components and their properties
        /// </summary>
        public string? Config { get; set; }

        /// <summary>
        /// Source of the app: 'created' (from App Builder) or 'downloaded' (from Marketplace)
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Source { get; set; } = "created";

        /// <summary>
        /// If downloaded, the original Marketplace app ID
        /// </summary>
        public long? MarketplaceAppId { get; set; }

        /// <summary>
        /// If downloaded, the original author's name
        /// </summary>
        [StringLength(255)]
        public string? OriginalAuthor { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // --- Relationship with User ---
        [ForeignKey("AppUser")]
        public string AppUserId { get; set; } = null!;
        public AppUser AppUser { get; set; } = null!;
    }
}
