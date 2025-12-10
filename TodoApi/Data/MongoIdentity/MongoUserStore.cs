using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using TodoApi.Models.MongoIdentity;
using System.Security.Claims;
using System.Linq;

namespace TodoApi.Data.MongoIdentity
{
    /// <summary>
    /// Custom UserStore cho MongoDB - implement IUserStore, IUserPasswordStore, etc.
    /// </summary>
    public class MongoUserStore : 
        IUserStore<AppUser>,
        IUserPasswordStore<AppUser>,
        IUserEmailStore<AppUser>,
        IUserRoleStore<AppUser>,
        IUserClaimStore<AppUser>,
        IUserLoginStore<AppUser>,
        IUserAuthenticationTokenStore<AppUser>,
        IUserLockoutStore<AppUser>,
        IUserTwoFactorStore<AppUser>,
        IUserPhoneNumberStore<AppUser>
    {
        private readonly IMongoCollection<AppUser> _users;
        private readonly IMongoCollection<Models.MongoIdentity.IdentityRole> _roles;

        public MongoUserStore(IMongoDatabase database)
        {
            _users = database.GetCollection<AppUser>("users");
            _roles = database.GetCollection<Models.MongoIdentity.IdentityRole>("roles");
        }

        // IUserStore
        public async Task<IdentityResult> CreateAsync(AppUser user, CancellationToken cancellationToken)
        {
            await _users.InsertOneAsync(user, cancellationToken: cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<IdentityResult> UpdateAsync(AppUser user, CancellationToken cancellationToken)
        {
            user.ConcurrencyStamp = Guid.NewGuid().ToString();
            var filter = Builders<AppUser>.Filter.Eq(u => u.Id, user.Id);
            await _users.ReplaceOneAsync(filter, user, cancellationToken: cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<IdentityResult> DeleteAsync(AppUser user, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.Eq(u => u.Id, user.Id);
            await _users.DeleteOneAsync(filter, cancellationToken);
            return IdentityResult.Success;
        }

        public async Task<AppUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.Eq(u => u.Id, userId);
            return await _users.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<AppUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.Eq(u => u.NormalizedUserName, normalizedUserName);
            return await _users.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<string> GetUserIdAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.Id);
        }

        public Task<string?> GetUserNameAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.UserName);
        }

        public Task SetUserNameAsync(AppUser user, string? userName, CancellationToken cancellationToken)
        {
            user.UserName = userName;
            return Task.CompletedTask;
        }

        public Task<string?> GetNormalizedUserNameAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.NormalizedUserName);
        }

        public Task SetNormalizedUserNameAsync(AppUser user, string? normalizedName, CancellationToken cancellationToken)
        {
            user.NormalizedUserName = normalizedName;
            return Task.CompletedTask;
        }

        public void Dispose() { }

        // IUserPasswordStore
        public Task SetPasswordHashAsync(AppUser user, string? passwordHash, CancellationToken cancellationToken)
        {
            user.PasswordHash = passwordHash;
            return Task.CompletedTask;
        }

        public Task<string?> GetPasswordHashAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.PasswordHash);
        }

        public Task<bool> HasPasswordAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(!string.IsNullOrEmpty(user.PasswordHash));
        }

        // IUserEmailStore
        public Task SetEmailAsync(AppUser user, string? email, CancellationToken cancellationToken)
        {
            user.Email = email;
            return Task.CompletedTask;
        }

        public Task<string?> GetEmailAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.Email);
        }

        public Task<bool> GetEmailConfirmedAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.EmailConfirmed);
        }

        public Task SetEmailConfirmedAsync(AppUser user, bool confirmed, CancellationToken cancellationToken)
        {
            user.EmailConfirmed = confirmed;
            return Task.CompletedTask;
        }

        public async Task<AppUser?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
        {
            // Normalize email nếu chưa được normalize
            var normalized = normalizedEmail?.ToUpperInvariant();
            var filter = Builders<AppUser>.Filter.Eq(u => u.NormalizedEmail, normalized);
            return await _users.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        public Task<string?> GetNormalizedEmailAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.NormalizedEmail);
        }

        public Task SetNormalizedEmailAsync(AppUser user, string? normalizedEmail, CancellationToken cancellationToken)
        {
            user.NormalizedEmail = normalizedEmail;
            return Task.CompletedTask;
        }

        // IUserRoleStore
        public async Task AddToRoleAsync(AppUser user, string roleName, CancellationToken cancellationToken)
        {
            // Normalize role name để đảm bảo consistency
            // UserManager có thể truyền role name đã được normalize (uppercase)
            // Nhưng chúng ta muốn lưu với case đúng (PascalCase: "Admin", "User")
            string normalizedRoleName = roleName?.ToUpperInvariant();
            string correctRoleName = normalizedRoleName switch
            {
                "ADMIN" => "Admin",
                "USER" => "User",
                _ => roleName // Giữ nguyên nếu không match
            };

            // Kiểm tra case-insensitive
            if (!user.Roles.Any(r => r.Equals(correctRoleName, StringComparison.OrdinalIgnoreCase)))
            {
                // Xóa role cũ nếu có (case khác)
                user.Roles.RemoveAll(r => r.Equals(correctRoleName, StringComparison.OrdinalIgnoreCase));
                user.Roles.Add(correctRoleName);
                // Lưu thay đổi vào database
                await UpdateAsync(user, cancellationToken);
            }
        }

        public async Task RemoveFromRoleAsync(AppUser user, string roleName, CancellationToken cancellationToken)
        {
            // Normalize role name để đảm bảo consistency
            string normalizedRoleName = roleName?.ToUpperInvariant();
            string correctRoleName = normalizedRoleName switch
            {
                "ADMIN" => "Admin",
                "USER" => "User",
                _ => roleName // Giữ nguyên nếu không match
            };

            // Xóa role (case-insensitive)
            user.Roles.RemoveAll(r => r.Equals(correctRoleName, StringComparison.OrdinalIgnoreCase));
            // Lưu thay đổi vào database
            await UpdateAsync(user, cancellationToken);
        }

        public Task<IList<string>> GetRolesAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult<IList<string>>(user.Roles);
        }

        public Task<bool> IsInRoleAsync(AppUser user, string roleName, CancellationToken cancellationToken)
        {
            // Normalize role name để đảm bảo consistency
            string normalizedRoleName = roleName?.ToUpperInvariant();
            string correctRoleName = normalizedRoleName switch
            {
                "ADMIN" => "Admin",
                "USER" => "User",
                _ => roleName // Giữ nguyên nếu không match
            };

            // Kiểm tra case-insensitive
            return Task.FromResult(user.Roles.Any(r => r.Equals(correctRoleName, StringComparison.OrdinalIgnoreCase)));
        }

        public async Task<IList<AppUser>> GetUsersInRoleAsync(string roleName, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.AnyEq(u => u.Roles, roleName);
            var users = await _users.Find(filter).ToListAsync(cancellationToken);
            return users;
        }

        // IUserClaimStore
        public Task<IList<Claim>> GetClaimsAsync(AppUser user, CancellationToken cancellationToken)
        {
            var claims = user.Claims.Select(c => new Claim(c.Type, c.Value)).ToList();
            return Task.FromResult<IList<Claim>>(claims);
        }

        public Task AddClaimsAsync(AppUser user, IEnumerable<Claim> claims, CancellationToken cancellationToken)
        {
            foreach (var claim in claims)
            {
                if (!user.Claims.Any(c => c.Type == claim.Type && c.Value == claim.Value))
                {
                    user.Claims.Add(new UserClaim { Type = claim.Type, Value = claim.Value });
                }
            }
            return Task.CompletedTask;
        }

        public Task ReplaceClaimAsync(AppUser user, Claim claim, Claim newClaim, CancellationToken cancellationToken)
        {
            var existingClaim = user.Claims.FirstOrDefault(c => c.Type == claim.Type && c.Value == claim.Value);
            if (existingClaim != null)
            {
                existingClaim.Type = newClaim.Type;
                existingClaim.Value = newClaim.Value;
            }
            return Task.CompletedTask;
        }

        public Task RemoveClaimsAsync(AppUser user, IEnumerable<Claim> claims, CancellationToken cancellationToken)
        {
            foreach (var claim in claims)
            {
                user.Claims.RemoveAll(c => c.Type == claim.Type && c.Value == claim.Value);
            }
            return Task.CompletedTask;
        }

        public async Task<IList<AppUser>> GetUsersForClaimAsync(Claim claim, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.ElemMatch(u => u.Claims, 
                c => c.Type == claim.Type && c.Value == claim.Value);
            var users = await _users.Find(filter).ToListAsync(cancellationToken);
            return users;
        }

        // IUserLoginStore
        public Task AddLoginAsync(AppUser user, UserLoginInfo login, CancellationToken cancellationToken)
        {
            if (!user.Logins.Any(l => l.LoginProvider == login.LoginProvider && l.ProviderKey == login.ProviderKey))
            {
                user.Logins.Add(new UserLogin
                {
                    LoginProvider = login.LoginProvider,
                    ProviderKey = login.ProviderKey,
                    ProviderDisplayName = login.ProviderDisplayName
                });
            }
            return Task.CompletedTask;
        }

        public Task RemoveLoginAsync(AppUser user, string loginProvider, string providerKey, CancellationToken cancellationToken)
        {
            user.Logins.RemoveAll(l => l.LoginProvider == loginProvider && l.ProviderKey == providerKey);
            return Task.CompletedTask;
        }

        public Task<IList<UserLoginInfo>> GetLoginsAsync(AppUser user, CancellationToken cancellationToken)
        {
            var logins = user.Logins.Select(l => new UserLoginInfo(l.LoginProvider, l.ProviderKey, l.ProviderDisplayName)).ToList();
            return Task.FromResult<IList<UserLoginInfo>>(logins);
        }

        public async Task<AppUser?> FindByLoginAsync(string loginProvider, string providerKey, CancellationToken cancellationToken)
        {
            var filter = Builders<AppUser>.Filter.ElemMatch(u => u.Logins,
                l => l.LoginProvider == loginProvider && l.ProviderKey == providerKey);
            return await _users.Find(filter).FirstOrDefaultAsync(cancellationToken);
        }

        // IUserTokenStore
        public Task SetTokenAsync(AppUser user, string loginProvider, string name, string? value, CancellationToken cancellationToken)
        {
            var token = user.Tokens.FirstOrDefault(t => t.LoginProvider == loginProvider && t.Name == name);
            if (token != null)
            {
                token.Value = value;
            }
            else
            {
                user.Tokens.Add(new UserToken { LoginProvider = loginProvider, Name = name, Value = value });
            }
            return Task.CompletedTask;
        }

        public Task RemoveTokenAsync(AppUser user, string loginProvider, string name, CancellationToken cancellationToken)
        {
            user.Tokens.RemoveAll(t => t.LoginProvider == loginProvider && t.Name == name);
            return Task.CompletedTask;
        }

        public Task<string?> GetTokenAsync(AppUser user, string loginProvider, string name, CancellationToken cancellationToken)
        {
            var token = user.Tokens.FirstOrDefault(t => t.LoginProvider == loginProvider && t.Name == name);
            return Task.FromResult(token?.Value);
        }

        // IUserLockoutStore
        public Task<DateTimeOffset?> GetLockoutEndDateAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.LockoutEnd);
        }

        public Task SetLockoutEndDateAsync(AppUser user, DateTimeOffset? lockoutEnd, CancellationToken cancellationToken)
        {
            user.LockoutEnd = lockoutEnd;
            return Task.CompletedTask;
        }

        public Task<int> IncrementAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
        {
            user.AccessFailedCount++;
            return Task.FromResult(user.AccessFailedCount);
        }

        public Task ResetAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
        {
            user.AccessFailedCount = 0;
            return Task.CompletedTask;
        }

        public Task<int> GetAccessFailedCountAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.AccessFailedCount);
        }

        public Task<bool> GetLockoutEnabledAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.LockoutEnabled);
        }

        public Task SetLockoutEnabledAsync(AppUser user, bool enabled, CancellationToken cancellationToken)
        {
            user.LockoutEnabled = enabled;
            return Task.CompletedTask;
        }

        // IUserTwoFactorStore
        public Task SetTwoFactorEnabledAsync(AppUser user, bool enabled, CancellationToken cancellationToken)
        {
            user.TwoFactorEnabled = enabled;
            return Task.CompletedTask;
        }

        public Task<bool> GetTwoFactorEnabledAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.TwoFactorEnabled);
        }

        // IUserPhoneNumberStore
        public Task SetPhoneNumberAsync(AppUser user, string? phoneNumber, CancellationToken cancellationToken)
        {
            user.PhoneNumber = phoneNumber;
            return Task.CompletedTask;
        }

        public Task<string?> GetPhoneNumberAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.PhoneNumber);
        }

        public Task<bool> GetPhoneNumberConfirmedAsync(AppUser user, CancellationToken cancellationToken)
        {
            return Task.FromResult(user.PhoneNumberConfirmed);
        }

        public Task SetPhoneNumberConfirmedAsync(AppUser user, bool confirmed, CancellationToken cancellationToken)
        {
            user.PhoneNumberConfirmed = confirmed;
            return Task.CompletedTask;
        }
    }
}

