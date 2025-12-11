using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // DTO for creating a new UserApp
    public class CreateUserAppDTO
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = "Untitled App";

        [StringLength(50)]
        public string Icon { get; set; } = "📱";

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Config { get; set; }

        [StringLength(20)]
        public string Source { get; set; } = "created";
    }

    // DTO for updating a UserApp
    public class UpdateUserAppDTO
    {
        [StringLength(255)]
        public string? Name { get; set; }

        [StringLength(50)]
        public string? Icon { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Config { get; set; }
    }

    // DTO for response
    public class UserAppDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = "";
        public string Icon { get; set; } = "📱";
        public string? Description { get; set; }
        public string? Config { get; set; }
        public string Source { get; set; } = "created";
        public string? MarketplaceAppId { get; set; }
        public string? OriginalAuthor { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // DTO for saving from App Builder
    public class SaveFromBuilderDTO
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = "Untitled App";

        [StringLength(50)]
        public string Icon { get; set; } = "📱";

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Config { get; set; }
    }
}
