using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    /// <summary>
    /// UserApp - Biểu diễn một ứng dụng thuộc sở hữu của người dùng (tạo từ App Builder hoặc tải về từ Marketplace)
    /// </summary>
    public class UserApp
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        public string Name { get; set; } = "Untitled App";

        [BsonElement("icon")]
        public string Icon { get; set; } = "📱";

        [BsonElement("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Cấu hình JSON lưu trữ tất cả các components và thuộc tính của chúng
        /// </summary>
        [BsonElement("config")]
        public string? Config { get; set; }

        /// <summary>
        /// Nguồn gốc của ứng dụng: 'created' (từ App Builder) hoặc 'downloaded' (từ Marketplace)
        /// </summary>
        [BsonElement("source")]
        public string Source { get; set; } = "created";

        /// <summary>
        /// Nếu được tải xuống, đây là ID ứng dụng gốc từ Marketplace
        /// </summary>
        [BsonElement("marketplaceAppId")]
        public string? MarketplaceAppId { get; set; }

        /// <summary>
        /// Nếu được tải xuống, đây là tên tác giả gốc
        /// </summary>
        [BsonElement("originalAuthor")]
        public string? OriginalAuthor { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // --- Relationship with User ---
        [BsonElement("appUserId")]
        public string AppUserId { get; set; } = null!;

        /// <summary>
        /// Tên database riêng cho app (nếu tenantMode = "separate")
        /// Format: app_{appId} hoặc app_{hash}
        /// </summary>
        [BsonElement("databaseName")]
        public string? DatabaseName { get; set; }

        /// <summary>
        /// Chế độ tenant: "shared" (dùng AppId trong cùng database) hoặc "separate" (database riêng)
        /// Mặc định (Default): "shared" để tương thích ngược (backward compatible)
        /// </summary>
        [BsonElement("tenantMode")]
        public string TenantMode { get; set; } = "shared";
    }
}
