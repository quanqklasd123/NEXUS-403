// Dtos/TodoItemDTO.cs
namespace TodoApi.Dtos
{
    // Đây là những gì client sẽ THẤY khi GET 1 item
    public class TodoItemDTO
    {
        public string Id { get; set; } = string.Empty; // <-- Có Id
        public string? Title { get; set; }
        public int Status { get; set;}
        public int Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public string TodoListId { get; set; } = string.Empty;
        public string? TodoListName { get; set; }
    }
}