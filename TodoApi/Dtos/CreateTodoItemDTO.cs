// Dtos/CreateTodoItemDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // Chỉ chứa những gì ta CẦN để TẠO MỚI một Item (Only contains what we NEED to CREATE)
    public class CreateTodoItemDTO
    {
        [Required]
        [StringLength(200)]
        public string? Title { get; set; }

        public int Status { get; set; } = 0;

        [Range(0, 5)]
        public int Priority { get; set; } = 1;

        public DateTime? DueDate { get; set; }

        // Đây là thứ duy nhất ta cần để tạo quan hệ
        [Required] 
        public string TodoListId { get; set; } = string.Empty;

        /// <summary>
        /// ID của UserApp mà item này thuộc về (Hỗ trợ đa người thuê - Multi-tenant support)
        /// Nullable để tương thích ngược (backward compatible)
        /// </summary>
        public string? AppId { get; set; }

        // Lưu ý (Note): KHÔNG có 'Id' và KHÔNG có 'TodoList' object
    }
}