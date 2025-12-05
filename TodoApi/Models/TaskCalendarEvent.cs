// Models/TaskCalendarEvent.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
    public class TaskCalendarEvent
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public long TodoItemId { get; set; }

        [Required]
        [StringLength(255)]
        public string GoogleEventId { get; set; } = string.Empty;

        [StringLength(255)]
        public string CalendarId { get; set; } = "primary";

        // Tracking notification status
        public bool NotificationSent_00h { get; set; } = false;

        public bool NotificationSent_ExactTime { get; set; } = false;

        public DateTime? NotificationSent_00h_At { get; set; }

        public DateTime? NotificationSent_ExactTime_At { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("TodoItemId")]
        public TodoItem TodoItem { get; set; } = null!;
    }
}

