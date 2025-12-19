using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    /// <summary>
    /// DTO để chuyển đổi (switch) chế độ tenant của UserApp
    /// </summary>
    public class SwitchTenantModeDTO
    {
        [Required]
        [StringLength(20)]
        public string TenantMode { get; set; } = "shared"; // "shared" or "separate"
    }
}

