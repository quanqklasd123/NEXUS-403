// Data/TodoContext.cs
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace TodoApi.Data
{
    public class TodoContext : IdentityDbContext<AppUser>
    {
        public TodoContext(DbContextOptions<TodoContext> options)
            : base(options)
        {
        }

        public DbSet<TodoItem> TodoItems { get; set; } = null!;
        public DbSet<TodoList> TodoLists { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<GoogleCalendarToken> GoogleCalendarTokens { get; set; } = null!;
        public DbSet<TaskCalendarEvent> TaskCalendarEvents { get; set; } = null!;
        public DbSet<UserApp> UserApps { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique constraint: Mỗi TodoItem chỉ có 1 TaskCalendarEvent
            modelBuilder.Entity<TaskCalendarEvent>()
                .HasIndex(e => e.TodoItemId)
                .IsUnique();

            // Unique constraint: Mỗi User chỉ có 1 GoogleCalendarToken
            modelBuilder.Entity<GoogleCalendarToken>()
                .HasIndex(t => t.AppUserId)
                .IsUnique();
        }
    }
}

