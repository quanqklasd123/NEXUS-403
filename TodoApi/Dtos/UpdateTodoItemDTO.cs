// Dtos/UpdateTodoItemDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    /// <summary>
    /// DTO cho việc cập nhật TodoItem
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
        /// ID của UserApp mà item này thuộc về (Multi-tenant support)
        /// Nullable để backward compatible
        /// </summary>
        public string? AppId { get; set; }
    }
}
