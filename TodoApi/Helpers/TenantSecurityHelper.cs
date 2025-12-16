using MongoDB.Bson;
using MongoDB.Driver;
using TodoApi.Data;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Helpers
{
    /// <summary>
    /// Helper class để verify security và validation cho multi-tenant
    /// </summary>
    public class TenantSecurityHelper
    {
        private readonly MongoDbContext _mongoContext;
        private readonly ILogger<TenantSecurityHelper> _logger;

        public TenantSecurityHelper(MongoDbContext mongoContext, ILogger<TenantSecurityHelper> logger)
        {
            _mongoContext = mongoContext;
            _logger = logger;
        }

        /// <summary>
        /// Verify AppId ownership - đảm bảo app thuộc về user hiện tại
        /// </summary>
        /// <param name="appId">ID của UserApp cần verify</param>
        /// <param name="userId">ID của user hiện tại (từ JWT token)</param>
        /// <returns>True nếu app thuộc về user, false nếu không</returns>
        public async Task<bool> VerifyAppOwnershipAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return true; // Không có AppId thì không cần verify (backward compatible)
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                _logger.LogWarning("VerifyAppOwnership called with empty userId");
                return false;
            }

            // Validate AppId format (MongoDB ObjectId)
            if (!IsValidObjectId(appId))
            {
                _logger.LogWarning("Invalid AppId format: {AppId}", appId);
                return false;
            }

            try
            {
                var app = await _mongoContext.UserApps
                    .Find(a => a.Id == appId && a.AppUserId == userId)
                    .FirstOrDefaultAsync();

                if (app == null)
                {
                    _logger.LogWarning("App ownership verification failed: AppId={AppId}, UserId={UserId}", appId, userId);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying app ownership: AppId={AppId}, UserId={UserId}", appId, userId);
                return false; // Fail secure: return false on error
            }
        }

        /// <summary>
        /// Verify AppId ownership và throw exception nếu không owned
        /// </summary>
        /// <param name="appId">ID của UserApp cần verify</param>
        /// <param name="userId">ID của user hiện tại</param>
        /// <exception cref="UnauthorizedAccessException">Nếu app không thuộc về user</exception>
        public async Task VerifyAppOwnershipOrThrowAsync(string? appId, string userId)
        {
            if (!await VerifyAppOwnershipAsync(appId, userId))
            {
                _logger.LogWarning("Unauthorized access attempt: AppId={AppId}, UserId={UserId}", appId, userId);
                throw new UnauthorizedAccessException("You don't have access to this app");
            }
        }

        /// <summary>
        /// Validate AppId format (MongoDB ObjectId)
        /// </summary>
        public bool IsValidObjectId(string? appId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return false;
            }

            return ObjectId.TryParse(appId, out _);
        }

        /// <summary>
        /// Validate AppId và verify ownership trong một call
        /// </summary>
        public async Task<(bool IsValid, bool IsOwned)> ValidateAndVerifyAppIdAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return (true, true); // Null AppId is valid and owned (backward compatible)
            }

            var isValid = IsValidObjectId(appId);
            if (!isValid)
            {
                return (false, false);
            }

            var isOwned = await VerifyAppOwnershipAsync(appId, userId);
            return (true, isOwned);
        }

        /// <summary>
        /// Get UserApp và verify ownership
        /// </summary>
        /// <returns>UserApp nếu owned, null nếu không</returns>
        public async Task<UserApp?> GetUserAppIfOwnedAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId) || !IsValidObjectId(appId))
            {
                return null;
            }

            try
            {
                var app = await _mongoContext.UserApps
                    .Find(a => a.Id == appId && a.AppUserId == userId)
                    .FirstOrDefaultAsync();

                return app;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting UserApp: AppId={AppId}, UserId={UserId}", appId, userId);
                return null;
            }
        }

        /// <summary>
        /// Verify AppId không thể set thành app của user khác
        /// Khi user cố gắng set AppId trong DTO, verify nó thuộc về user hiện tại
        /// </summary>
        public async Task<bool> CanUserSetAppIdAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return true; // Null AppId is allowed (backward compatible)
            }

            return await VerifyAppOwnershipAsync(appId, userId);
        }
    }
}
