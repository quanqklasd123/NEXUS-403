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

        // Collections
        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }

        // Helper methods for common collections
        public IMongoCollection<Models.Project> Projects => GetCollection<Models.Project>("projects");
        public IMongoCollection<Models.UserApp> UserApps => GetCollection<Models.UserApp>("userApps");
        public IMongoCollection<Models.TodoList> TodoLists => GetCollection<Models.TodoList>("todoLists");
        public IMongoCollection<Models.TodoItem> TodoItems => GetCollection<Models.TodoItem>("todoItems");
        // Google Calendar collections đã được xóa

        // Identity collections
        public IMongoCollection<Models.MongoIdentity.AppUser> Users => GetCollection<Models.MongoIdentity.AppUser>("users");
        public IMongoCollection<Models.MongoIdentity.IdentityRole> Roles => GetCollection<Models.MongoIdentity.IdentityRole>("roles");

        // Marketplace collections
        public IMongoCollection<Models.Category> Categories => GetCollection<Models.Category>("categories");

        // Database access for Identity stores
        public IMongoDatabase Database => _database;
    }
}

