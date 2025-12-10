// Models/TodoItem.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    public class TodoItem
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("title")]
        public string? Title { get; set; }

        // Mặc định (default) là 0 (tức là "To Do")
        [BsonElement("status")]
        public int Status { get; set; } = 0;

        [BsonElement("priority")]
        public int Priority { get; set; } = 1; 

        // Thêm Ngày hết hạn (Due Date)
        [BsonElement("dueDate")]
        public DateTime? DueDate { get; set; }

        // --- THUỘC TÍNH MỚI CHO "QUAN HỆ" ---
        // Khóa ngoại: Lưu ObjectId của List mà item này thuộc về
        [BsonElement("todoListId")]
        public string TodoListId { get; set; }
    }
}