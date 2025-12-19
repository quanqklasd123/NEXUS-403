using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    public class Project
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        public string Name { get; set; }

        [BsonElement("description")]
        public string? Description { get; set; }

        // Đây là nơi lưu toàn bộ trạng thái Canvas (các nút, ô nhập liệu...)
        // Chúng ta lưu dưới dạng chuỗi JSON
        [BsonElement("jsonData")]
        public string? JsonData { get; set; } 

        [BsonElement("isPublished")]
        public bool IsPublished { get; set; } = false;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- Quan hệ với User ---
        [BsonElement("appUserId")]
        public string AppUserId { get; set; }

        // --- Marketplace fields ---
        [BsonElement("category")]
        public string? Category { get; set; } // Category name

        [BsonElement("price")]
        public string? Price { get; set; } // null = Free

        [BsonElement("marketplaceAppId")]
        public string? MarketplaceAppId { get; set; } // ID của app gốc từ marketplace (nếu được install)

        [BsonElement("originalAuthor")]
        public string? OriginalAuthor { get; set; } // UserId của author gốc (nếu được install từ marketplace)

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}