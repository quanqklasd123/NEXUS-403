// Models/TodoItem.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace TodoApi.Models
{
    public class TodoItem
    {
        public long Id { get; set; }        // ID duy nhất
        public string? Title { get; set; }   // Tên công việc
        public bool IsDone { get; set; }  // Trạng thái hoàn thành
        // public string? Secret { get; set; } // Bạn có thể thêm các trường khác sau
        // Chúng ta có thể dùng 1 con số để quy ước độ ưu tiên
        // Ví dụ: 0 = Thấp, 1 = Trung bình, 2 = Cao
        // Đặt giá trị mặc định là 1 (Trung bình)
        [Range(0, 5)] // Giới hạn giá trị Priority từ 0 đến 5
        public int Priority { get; set; } = 1; 

        // Thêm Ngày hết hạn (Due Date)
        // Dấu hỏi (?) có nghĩa là thuộc tính này CÓ THỂ BỊ NULL
        // (tức là một công việc không bắt buộc phải có ngày hết hạn)
        public DateTime? DueDate { get; set; }

        
        // --- THUỘC TÍNH MỚI CHO "QUAN HỆ" ---

        // 1. Khóa ngoại (Foreign Key)
        // Đây là trường sẽ lưu Id của List mà item này thuộc về
        [ForeignKey("TodoList")]
        public long TodoListId { get; set; }

        // 2. Thuộc tính điều hướng (Navigation Property)
        // Giúp EF Core hiểu mối quan hệ
        public TodoList TodoList { get; set; }
    }
}