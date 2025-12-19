using MongoDB.Bson;
using MongoDB.Driver;
using TodoApi.Data;
using TodoApi.Models;
using Microsoft.Extensions.Logging;

namespace TodoApi.Helpers
{
    /// <summary>
    /// Lớp trợ giúp (Helper class) để xác minh bảo mật (verify security) và kiểm tra tính hợp lệ (validation) cho đa người thuê (multi-tenant)
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
        /// Xác minh quyền sở hữu AppId (Verify AppId ownership) - đảm bảo app thuộc về người dùng hiện tại
        /// Hỗ trợ cả UserApp (Marketplace) và Project (App Builder)
        /// </summary>
        /// <param name="appId">ID của UserApp hoặc Project cần verify</param>
        /// <param name="userId">ID của user hiện tại (từ JWT token)</param>
        /// <returns>True nếu app thuộc về user, false nếu không</returns>
        public async Task<bool> VerifyAppOwnershipAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return true; // Không có AppId thì không cần xác minh (backward compatible - tương thích ngược)
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
                // Thử tìm UserApp trước (Marketplace apps)
                var app = await _mongoContext.UserApps
                    .Find(a => a.Id == appId && a.AppUserId == userId)
                    .FirstOrDefaultAsync();

                if (app != null)
                {
                    return true;
                }

                // Không tìm thấy UserApp, thử tìm Project (App Builder)
                var project = await _mongoContext.Projects
                    .Find(p => p.Id == appId && p.AppUserId == userId)
                    .FirstOrDefaultAsync();

                if (project != null)
                {
                    return true;
                }

                _logger.LogWarning("App/Project ownership verification failed: AppId={AppId}, UserId={UserId}", appId, userId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying app ownership: AppId={AppId}, UserId={UserId}", appId, userId);
                return false; // Bảo mật an toàn (Fail secure): trả về false khi có lỗi
            }
        }

        /// <summary>
        /// Xác minh quyền sở hữu AppId (Verify AppId ownership) và ném ngoại lệ (throw exception) nếu không sở hữu (not owned)
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
        /// Kiểm tra tính hợp lệ (Validate) định dạng AppId (MongoDB ObjectId)
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
        /// Kiểm tra tính hợp lệ (Validate) AppId và xác minh quyền sở hữu trong một lần gọi (one call)
        /// </summary>
        public async Task<(bool IsValid, bool IsOwned)> ValidateAndVerifyAppIdAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return (true, true); // Null AppId là hợp lệ và được sở hữu (backward compatible - tương thích ngược)
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
        /// Lấy UserApp và xác minh quyền sở hữu (Get UserApp and verify ownership)
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
        /// Xác minh (Verify) AppId không thể được đặt thành app của người dùng khác
        /// Khi người dùng cố gắng đặt AppId trong DTO, xác minh nó thuộc về người dùng hiện tại
        /// </summary>
        public async Task<bool> CanUserSetAppIdAsync(string? appId, string userId)
        {
            if (string.IsNullOrWhiteSpace(appId))
            {
                return true; // Null AppId là cho phép (backward compatible - tương thích ngược)
            }

            return await VerifyAppOwnershipAsync(appId, userId);
        }
    }
}
