using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodoApi.Models.MongoIdentity
{
    /// <summary>
    /// IdentityRole model cho MongoDB
    /// </summary>
    public class IdentityRole
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("normalizedName")]
        public string? NormalizedName { get; set; }

        [BsonElement("concurrencyStamp")]
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();
    }
}

