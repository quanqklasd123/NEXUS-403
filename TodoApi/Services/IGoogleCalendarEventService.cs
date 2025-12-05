// Services/IGoogleCalendarEventService.cs
namespace TodoApi.Services
{
    public interface IGoogleCalendarEventService
    {
        /// <summary>
        /// Tạo calendar event cho một task
        /// </summary>
        Task<string?> CreateCalendarEventAsync(string userId, long todoItemId, string title, string? description, DateTime dueDate, string? categoryName);

        /// <summary>
        /// Cập nhật calendar event khi task được cập nhật
        /// </summary>
        Task<bool> UpdateCalendarEventAsync(string userId, long todoItemId, string title, string? description, DateTime? dueDate, string? categoryName);

        /// <summary>
        /// Xóa calendar event khi task bị xóa
        /// </summary>
        Task<bool> DeleteCalendarEventAsync(string userId, long todoItemId);

        /// <summary>
        /// Kiểm tra và tạo lại event nếu chưa có (sync)
        /// </summary>
        Task<bool> SyncTaskToCalendarAsync(string userId, long todoItemId, string title, string? description, DateTime? dueDate, string? categoryName);
    }
}




