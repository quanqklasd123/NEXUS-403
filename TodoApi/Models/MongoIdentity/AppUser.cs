using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Microsoft.AspNetCore.Identity;

namespace TodoApi.Models.MongoIdentity
{
    /// <summary>
    /// AppUser model cho MongoDB - thay thế IdentityUser
    /// </summary>
    public class AppUser
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("userName")]
        public string? UserName { get; set; }

        [BsonElement("normalizedUserName")]
        public string? NormalizedUserName { get; set; }

        [BsonElement("email")]
        public string? Email { get; set; }

        [BsonElement("normalizedEmail")]
        public string? NormalizedEmail { get; set; }

        [BsonElement("emailConfirmed")]
        public bool EmailConfirmed { get; set; }

        [BsonElement("passwordHash")]
        public string? PasswordHash { get; set; }

        [BsonElement("securityStamp")]
        public string? SecurityStamp { get; set; }

        [BsonElement("concurrencyStamp")]
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("phoneNumber")]
        public string? PhoneNumber { get; set; }

        [BsonElement("phoneNumberConfirmed")]
        public bool PhoneNumberConfirmed { get; set; }

        [BsonElement("twoFactorEnabled")]
        public bool TwoFactorEnabled { get; set; }

        [BsonElement("lockoutEnd")]
        public DateTimeOffset? LockoutEnd { get; set; }

        [BsonElement("lockoutEnabled")]
        public bool LockoutEnabled { get; set; }

        [BsonElement("accessFailedCount")]
        public int AccessFailedCount { get; set; }

        [BsonElement("roles")]
        public List<string> Roles { get; set; } = new List<string>();

        [BsonElement("claims")]
        public List<UserClaim> Claims { get; set; } = new List<UserClaim>();

        [BsonElement("logins")]
        public List<UserLogin> Logins { get; set; } = new List<UserLogin>();

        [BsonElement("tokens")]
        public List<UserToken> Tokens { get; set; } = new List<UserToken>();
    }

    public class UserClaim
    {
        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("value")]
        public string Value { get; set; } = string.Empty;
    }

    public class UserLogin
    {
        [BsonElement("loginProvider")]
        public string LoginProvider { get; set; } = string.Empty;

        [BsonElement("providerKey")]
        public string ProviderKey { get; set; } = string.Empty;

        [BsonElement("providerDisplayName")]
        public string? ProviderDisplayName { get; set; }
    }

    public class UserToken
    {
        [BsonElement("loginProvider")]
        public string LoginProvider { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("value")]
        public string? Value { get; set; }
    }
}

