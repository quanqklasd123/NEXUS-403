// Dtos/CreateTodoItemDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // Chỉ chứa những gì ta CẦN để TẠO MỚI một Item
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
        /// ID của UserApp mà item này thuộc về (Multi-tenant support)
        /// Nullable để backward compatible
        /// </summary>
        public string? AppId { get; set; }

        // Lưu ý: KHÔNG có 'Id' và KHÔNG có 'TodoList' object
    }
}