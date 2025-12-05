// Services/GoogleCalendarEventService.cs
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Services
{
    public class GoogleCalendarEventService : IGoogleCalendarEventService
    {
        private readonly TodoContext _context;
        private readonly IGoogleCalendarService _googleCalendarService;
        private readonly ILogger<GoogleCalendarEventService> _logger;
        private readonly IConfiguration _configuration;

        public GoogleCalendarEventService(
            TodoContext context,
            IGoogleCalendarService googleCalendarService,
            ILogger<GoogleCalendarEventService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _googleCalendarService = googleCalendarService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Tạo CalendarService với access token
        /// </summary>
        private CalendarService CreateCalendarService(string accessToken)
        {
            var credential = GoogleCredential.FromAccessToken(accessToken)
                .CreateScoped(new[] { CalendarService.Scope.Calendar, CalendarService.Scope.CalendarEvents });

            return new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "Todo App Calendar"
            });
        }

        public async Task<string?> CreateCalendarEventAsync(
            string userId, 
            long todoItemId, 
            string title, 
            string? description, 
            DateTime dueDate, 
            string? categoryName)
        {
            try
            {
                // Kiểm tra user đã kết nối Google Calendar chưa
                var connectionStatus = await _googleCalendarService.GetConnectionStatusAsync(userId);
                if (connectionStatus == null || !connectionStatus.IsConnected)
                {
                    _logger.LogWarning("User {UserId} has not connected Google Calendar", userId);
                    return null;
                }

                // Lấy access token
                var accessToken = await _googleCalendarService.GetValidAccessTokenAsync(userId);

                // Tạo Google Calendar service
                var calendarService = CreateCalendarService(accessToken);

                // Tạo event
                var calendarEvent = new Event
                {
                    Summary = title,
                    Description = string.IsNullOrEmpty(description) 
                        ? $"Task from {categoryName ?? "Todo App"}" 
                        : $"{description}\n\nCategory: {categoryName ?? "Todo App"}",
                    Start = new EventDateTime
                    {
                        DateTimeDateTimeOffset = new DateTimeOffset(dueDate, TimeSpan.Zero),
                        TimeZone = "UTC"
                    },
                    End = new EventDateTime
                    {
                        DateTimeDateTimeOffset = new DateTimeOffset(dueDate.AddHours(1), TimeSpan.Zero), // End time = dueDate + 1 hour
                        TimeZone = "UTC"
                    },
                    Reminders = new Event.RemindersData
                    {
                        UseDefault = false,
                        Overrides = new List<EventReminder>
                        {
                            // Reminder 1: 1 day before (1440 minutes = 24 hours)
                            new EventReminder { Method = "email", Minutes = 1440 },
                            new EventReminder { Method = "popup", Minutes = 1440 },
                            // Reminder 2: At exact time (0 minutes)
                            new EventReminder { Method = "email", Minutes = 0 },
                            new EventReminder { Method = "popup", Minutes = 0 }
                        }
                    }
                };

                // Tạo event trong Google Calendar
                var createdEvent = await calendarService.Events.Insert(calendarEvent, "primary").ExecuteAsync();

                // Lưu GoogleEventId vào database
                var calendarEventRecord = new TaskCalendarEvent
                {
                    TodoItemId = todoItemId,
                    GoogleEventId = createdEvent.Id,
                    CalendarId = "primary",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.TaskCalendarEvents.Add(calendarEventRecord);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created Google Calendar event {EventId} for task {TaskId}", 
                    createdEvent.Id, todoItemId);

                return createdEvent.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Google Calendar event for task {TaskId}", todoItemId);
                return null;
            }
        }

        public async Task<bool> UpdateCalendarEventAsync(
            string userId, 
            long todoItemId, 
            string title, 
            string? description, 
            DateTime? dueDate, 
            string? categoryName)
        {
            try
            {
                // Kiểm tra user đã kết nối Google Calendar chưa
                var connectionStatus = await _googleCalendarService.GetConnectionStatusAsync(userId);
                if (connectionStatus == null || !connectionStatus.IsConnected)
                {
                    return false;
                }

                // Tìm calendar event record
                var calendarEventRecord = await _context.TaskCalendarEvents
                    .FirstOrDefaultAsync(e => e.TodoItemId == todoItemId);

                // Nếu không có dueDate hoặc dueDate bị xóa, xóa event
                if (!dueDate.HasValue)
                {
                    if (calendarEventRecord != null)
                    {
                        return await DeleteCalendarEventAsync(userId, todoItemId);
                    }
                    return true;
                }

                // Nếu chưa có event và có dueDate, tạo mới
                if (calendarEventRecord == null)
                {
                    var eventId = await CreateCalendarEventAsync(userId, todoItemId, title, description, dueDate.Value, categoryName);
                    return eventId != null;
                }

                // Lấy access token
                var accessToken = await _googleCalendarService.GetValidAccessTokenAsync(userId);

                // Tạo Google Calendar service
                var calendarService = CreateCalendarService(accessToken);

                // Lấy event hiện tại từ Google Calendar
                var existingEvent = await calendarService.Events.Get(calendarEventRecord.CalendarId, calendarEventRecord.GoogleEventId).ExecuteAsync();

                // Cập nhật thông tin event
                existingEvent.Summary = title;
                existingEvent.Description = string.IsNullOrEmpty(description) 
                    ? $"Task from {categoryName ?? "Todo App"}" 
                    : $"{description}\n\nCategory: {categoryName ?? "Todo App"}";
                existingEvent.Start = new EventDateTime
                {
                    DateTimeDateTimeOffset = new DateTimeOffset(dueDate.Value, TimeSpan.Zero),
                    TimeZone = "UTC"
                };
                existingEvent.End = new EventDateTime
                {
                    DateTimeDateTimeOffset = new DateTimeOffset(dueDate.Value.AddHours(1), TimeSpan.Zero),
                    TimeZone = "UTC"
                };
                existingEvent.Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new List<EventReminder>
                    {
                        new EventReminder { Method = "email", Minutes = 1440 },
                        new EventReminder { Method = "popup", Minutes = 1440 },
                        new EventReminder { Method = "email", Minutes = 0 },
                        new EventReminder { Method = "popup", Minutes = 0 }
                    }
                };

                // Update event trong Google Calendar
                await calendarService.Events.Update(existingEvent, calendarEventRecord.CalendarId, calendarEventRecord.GoogleEventId).ExecuteAsync();

                // Cập nhật thời gian trong database
                calendarEventRecord.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated Google Calendar event {EventId} for task {TaskId}", 
                    calendarEventRecord.GoogleEventId, todoItemId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating Google Calendar event for task {TaskId}", todoItemId);
                return false;
            }
        }

        public async Task<bool> DeleteCalendarEventAsync(string userId, long todoItemId)
        {
            try
            {
                // Tìm calendar event record
                var calendarEventRecord = await _context.TaskCalendarEvents
                    .FirstOrDefaultAsync(e => e.TodoItemId == todoItemId);

                if (calendarEventRecord == null)
                {
                    return true; // Không có event để xóa
                }

                // Kiểm tra user đã kết nối Google Calendar chưa
                var connectionStatus = await _googleCalendarService.GetConnectionStatusAsync(userId);
                if (connectionStatus == null || !connectionStatus.IsConnected)
                {
                    // Nếu không kết nối, chỉ xóa record trong database
                    _context.TaskCalendarEvents.Remove(calendarEventRecord);
                    await _context.SaveChangesAsync();
                    return true;
                }

                try
                {
                    // Lấy access token
                    var accessToken = await _googleCalendarService.GetValidAccessTokenAsync(userId);

                    // Tạo Google Calendar service
                    var calendarService = CreateCalendarService(accessToken);

                    // Xóa event khỏi Google Calendar
                    await calendarService.Events.Delete(calendarEventRecord.CalendarId, calendarEventRecord.GoogleEventId).ExecuteAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete event from Google Calendar, continuing with database deletion");
                }

                // Xóa record khỏi database
                _context.TaskCalendarEvents.Remove(calendarEventRecord);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted Google Calendar event for task {TaskId}", todoItemId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Google Calendar event for task {TaskId}", todoItemId);
                return false;
            }
        }

        public async Task<bool> SyncTaskToCalendarAsync(
            string userId, 
            long todoItemId, 
            string title, 
            string? description, 
            DateTime? dueDate, 
            string? categoryName)
        {
            // Kiểm tra xem đã có event chưa
            var existingEvent = await _context.TaskCalendarEvents
                .FirstOrDefaultAsync(e => e.TodoItemId == todoItemId);

            if (existingEvent == null && dueDate.HasValue)
            {
                // Chưa có event, tạo mới
                var eventId = await CreateCalendarEventAsync(userId, todoItemId, title, description, dueDate.Value, categoryName);
                return eventId != null;
            }
            else if (existingEvent != null && dueDate.HasValue)
            {
                // Đã có event, cập nhật
                return await UpdateCalendarEventAsync(userId, todoItemId, title, description, dueDate, categoryName);
            }
            else if (existingEvent != null && !dueDate.HasValue)
            {
                // Có event nhưng không có dueDate, xóa
                return await DeleteCalendarEventAsync(userId, todoItemId);
            }

            return true;
        }
    }
}
