// Models/TodoList.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    public class TodoList
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        public string Name { get; set; }

        // --- MongoDB: Items có thể embedded hoặc reference
        // Tạm thời dùng reference (lưu ObjectId của TodoItem)
        [BsonElement("itemIds")]
        public List<string> ItemIds { get; set; } = new List<string>();
        
        // 1. Khóa ngoại: Lưu ID của User sở hữu List này
        [BsonElement("appUserId")]
        public string AppUserId { get; set; }

        /// <summary>
        /// ID của UserApp mà list này thuộc về (Multi-tenant support)
        /// Nullable để backward compatible với existing data
        /// </summary>
        [BsonElement("appId")]
        public string? AppId { get; set; }
    }
}