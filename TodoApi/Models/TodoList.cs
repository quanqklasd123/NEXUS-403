// Models/TodoList.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
    public class TodoList
    {
        public long Id { get; set; } // Khóa chính của List

        [Required] // Bắt buộc phải có tên
        [StringLength(100)]
        public string Name { get; set; }

        // --- Đây là phần quan trọng của "Quan hệ" ---
        // Một List sẽ chứa một bộ sưu tập các Items
        // Chúng ta khởi tạo nó luôn để tránh lỗi null
        public ICollection<TodoItem> Items { get; set; } = new List<TodoItem>();
        
        // 1. Khóa ngoại: Lưu ID của User sở hữu List này
        [ForeignKey("AppUser")]
        public string AppUserId { get; set; }

        // 2. Thuộc tính điều hướng (Navigation property)
        public AppUser AppUser { get; set; }
    }
}