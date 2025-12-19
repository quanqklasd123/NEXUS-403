using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    public class CreateProjectDTO
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        // Khi Cập nhật (Update - Lưu), chúng ta sẽ gửi kèm cục JSON này (JSON data)
        public string? JsonData { get; set; }

        // Multi-tenant mode: "shared" hoặc "separate", mặc định là "separate"
        public string? TenantMode { get; set; } = "separate";
    }
}