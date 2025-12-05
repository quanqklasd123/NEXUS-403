using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintsToGoogleCalendarTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TaskCalendarEvents_TodoItemId",
                table: "TaskCalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_GoogleCalendarTokens_AppUserId",
                table: "GoogleCalendarTokens");

            migrationBuilder.CreateIndex(
                name: "IX_TaskCalendarEvents_TodoItemId",
                table: "TaskCalendarEvents",
                column: "TodoItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoogleCalendarTokens_AppUserId",
                table: "GoogleCalendarTokens",
                column: "AppUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TaskCalendarEvents_TodoItemId",
                table: "TaskCalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_GoogleCalendarTokens_AppUserId",
                table: "GoogleCalendarTokens");

            migrationBuilder.CreateIndex(
                name: "IX_TaskCalendarEvents_TodoItemId",
                table: "TaskCalendarEvents",
                column: "TodoItemId");

            migrationBuilder.CreateIndex(
                name: "IX_GoogleCalendarTokens_AppUserId",
                table: "GoogleCalendarTokens",
                column: "AppUserId");
        }
    }
}
