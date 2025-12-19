// Dtos/CreateTodoListDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // Chỉ chứa những gì ta CẦN để TẠO MỚI một List (Only contains what we NEED to CREATE)
    public class CreateTodoListDTO
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// ID của UserApp mà list này thuộc về (Hỗ trợ đa người thuê - Multi-tenant support)
        /// Nullable để tương thích ngược (backward compatible)
        /// </summary>
        public string? AppId { get; set; }
    }
}