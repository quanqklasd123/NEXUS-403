// Dtos/TodoListDTO.cs
namespace TodoApi.Dtos
{
    // Đây là những gì client sẽ THẤY khi GET 1 list
    public class TodoListDTO
    {
        public long Id { get; set; }
        public string Name { get; set; }

        // Quan trọng: Trả về một danh sách các DTO,
        // không phải Model CSDL, để tránh vòng lặp
        public ICollection<TodoItemDTO> Items { get; set; } = new List<TodoItemDTO>();
    }
}