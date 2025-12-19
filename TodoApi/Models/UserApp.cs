using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models
{
    /// <summary>
    /// UserApp - Represents an app owned by a user (created from App Builder or downloaded from Marketplace)
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
        /// JSON config storing all components and their properties
        /// </summary>
        [BsonElement("config")]
        public string? Config { get; set; }

        /// <summary>
        /// Source of the app: 'created' (from App Builder) or 'downloaded' (from Marketplace)
        /// </summary>
        [BsonElement("source")]
        public string Source { get; set; } = "created";

        /// <summary>
        /// If downloaded, the original Marketplace app ID
        /// </summary>
        [BsonElement("marketplaceAppId")]
        public string? MarketplaceAppId { get; set; }

        /// <summary>
        /// If downloaded, the original author's name
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
        /// Default: "shared" để backward compatible
        /// </summary>
        [BsonElement("tenantMode")]
        public string TenantMode { get; set; } = "shared";
    }
}
