// Services/IGoogleCalendarService.cs
namespace TodoApi.Services
{
    public interface IGoogleCalendarService
    {
        /// <summary>
        /// Tạo OAuth authorization URL để user có thể đăng nhập và cấp quyền
        /// </summary>
        Task<string> GetAuthorizationUrlAsync(string userId);

        /// <summary>
        /// Xử lý OAuth callback, lấy access token và refresh token từ Google
        /// </summary>
        Task<bool> HandleCallbackAsync(string userId, string code);

        /// <summary>
        /// Lấy access token hợp lệ (tự động refresh nếu cần)
        /// </summary>
        Task<string> GetValidAccessTokenAsync(string userId);

        /// <summary>
        /// Refresh access token khi hết hạn
        /// </summary>
        Task<bool> RefreshAccessTokenAsync(string userId);

        /// <summary>
        /// Kiểm tra xem user đã kết nối Google Calendar chưa
        /// </summary>
        Task<GoogleCalendarConnectionStatus?> GetConnectionStatusAsync(string userId);

        /// <summary>
        /// Xóa kết nối Google Calendar và revoke token
        /// </summary>
        Task<bool> DisconnectAsync(string userId);
    }

    public class GoogleCalendarConnectionStatus
    {
        public bool IsConnected { get; set; }
        public DateTime? ConnectedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}

