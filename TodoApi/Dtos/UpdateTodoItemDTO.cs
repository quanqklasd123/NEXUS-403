// Dtos/UpdateTodoItemDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    /// <summary>
    /// DTO (Data Transfer Object) cho việc cập nhật TodoItem
    /// </summary>
    public class UpdateTodoItemDTO
    {
        [StringLength(200)]
        public string? Title { get; set; }

        [Range(0, 2)]
        public int? Status { get; set; }

        [Range(0, 5)]
        public int? Priority { get; set; }

        public DateTime? DueDate { get; set; }

        public string? TodoListId { get; set; }

        /// <summary>
        /// ID của UserApp mà item này thuộc về (Hỗ trợ đa người thuê - Multi-tenant support)
        /// Nullable để tương thích ngược (backward compatible)
        /// </summary>
        public string? AppId { get; set; }
    }
}
