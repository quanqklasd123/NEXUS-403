using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using TodoApi.Models.MongoIdentity;

namespace TodoApi.Data.MongoIdentity
{
    /// <summary>
    /// Custom RoleStore cho MongoDB
    /// </summary>
    public class MongoRoleStore : IRoleStore<Models.MongoIdentity.IdentityRole>
    {
        private readonly IMongoCollection<Models.MongoIdentity.IdentityRole> _roles;

        public MongoRoleStore(IMongoDatabase database)
        {
            _roles = database.GetCollection<Models.MongoIdentity.IdentityRole>("roles");
        }

        public async Task<IdentityResult> CreateAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            await _roles.InsertOneAsync(role, cancellationToken: cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<IdentityResult> UpdateAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            role.ConcurrencyStamp = Guid.NewGuid().ToString();
            var filter = Builders<Models.MongoIdentity.IdentityRole>.Filter.Eq(r => r.Id, role.Id);
            await _roles.ReplaceOneAsync(filter, role, cancellationToken: cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<IdentityResult> DeleteAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            var filter = Builders<Models.MongoIdentity.IdentityRole>.Filter.Eq(r => r.Id, role.Id);
            await _roles.DeleteOneAsync(filter, cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<Models.MongoIdentity.IdentityRole?> FindByIdAsync(string roleId, CancellationToken cancellationToken)
        {
            var filter = Builders<Models.MongoIdentity.IdentityRole>.Filter.Eq(r => r.Id, roleId);
            return await _roles.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<Models.MongoIdentity.IdentityRole?> FindByNameAsync(string normalizedRoleName, CancellationToken cancellationToken)
        {
            var filter = Builders<Models.MongoIdentity.IdentityRole>.Filter.Eq(r => r.NormalizedName, normalizedRoleName);
            return await _roles.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<string> GetRoleIdAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            return Task.FromResult(role.Id);
        }

        public Task<string?> GetRoleNameAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            return Task.FromResult(role.Name);
        }

        public Task SetRoleNameAsync(Models.MongoIdentity.IdentityRole role, string? roleName, CancellationToken cancellationToken)
        {
            role.Name = roleName ?? string.Empty;
            return Task.CompletedTask;
        }

        public Task<string?> GetNormalizedRoleNameAsync(Models.MongoIdentity.IdentityRole role, CancellationToken cancellationToken)
        {
            return Task.FromResult(role.NormalizedName);
        }

        public Task SetNormalizedRoleNameAsync(Models.MongoIdentity.IdentityRole role, string? normalizedName, CancellationToken cancellationToken)
        {
            role.NormalizedName = normalizedName;
            return Task.CompletedTask;
        }

        public void Dispose() { }
    }
}
