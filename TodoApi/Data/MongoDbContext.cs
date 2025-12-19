using MongoDB.Driver;
using TodoApi.Data.MongoIdentity;

namespace TodoApi.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IMongoClient client, string databaseName)
        {
            _database = client.GetDatabase(databaseName);
        }

        // Các Collections (bộ sưu tập dữ liệu)
        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }

        // Các phương thức trợ giúp (Helper methods) cho các collections phổ biến
        public IMongoCollection<Models.Project> Projects => GetCollection<Models.Project>("projects");
        public IMongoCollection<Models.UserApp> UserApps => GetCollection<Models.UserApp>("userApps");
        public IMongoCollection<Models.TodoList> TodoLists => GetCollection<Models.TodoList>("todoLists");
        public IMongoCollection<Models.TodoItem> TodoItems => GetCollection<Models.TodoItem>("todoItems");
        // Các collections Google Calendar đã được gỡ bỏ (removed)

        // Các collections Identity (Hệ thống xác thực)
        public IMongoCollection<Models.MongoIdentity.AppUser> Users => GetCollection<Models.MongoIdentity.AppUser>("users");
        public IMongoCollection<Models.MongoIdentity.IdentityRole> Roles => GetCollection<Models.MongoIdentity.IdentityRole>("roles");

        // Các collections Marketplace (Chợ ứng dụng)
        public IMongoCollection<Models.Category> Categories => GetCollection<Models.Category>("categories");

        // Truy cập database cho các Identity stores (Kho lưu trữ xác thực)
        public IMongoDatabase Database => _database;
    }
}

