using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // DTO để tạo một UserApp mới (Data Transfer Object for creating)
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

        /// <summary>
        /// Chế độ Tenant: "shared" (mặc định - default) hoặc "separate" (tách biệt)
        /// </summary>
        [StringLength(20)]
        public string TenantMode { get; set; } = "shared";
    }

    // DTO để cập nhật một UserApp (Data Transfer Object for updating)
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

    // DTO để trả về (phản hồi - response)
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
        public string TenantMode { get; set; } = "shared";
        public string? DatabaseName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // DTO để lưu từ App Builder (Data Transfer Object for saving from App Builder)
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
