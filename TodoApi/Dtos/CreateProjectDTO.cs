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

        // Khi Update (Lưu), chúng ta sẽ gửi kèm cục JSON này
        public string? JsonData { get; set; }
    }
}