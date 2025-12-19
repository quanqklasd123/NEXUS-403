// Dtos/UpdateTodoListDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    /// <summary>
    /// DTO (Data Transfer Object) cho việc cập nhật TodoList
    /// </summary>
    public class UpdateTodoListDTO
    {
        [StringLength(100)]
        public string? Name { get; set; }

        /// <summary>
        /// ID của UserApp mà list này thuộc về (Hỗ trợ đa người thuê - Multi-tenant support)
        /// Nullable để tương thích ngược (backward compatible)
        /// </summary>
        public string? AppId { get; set; }
    }
}
