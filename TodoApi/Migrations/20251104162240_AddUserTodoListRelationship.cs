using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTodoListRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppUserId",
                table: "TodoLists",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TodoLists_AppUserId",
                table: "TodoLists",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TodoLists_AspNetUsers_AppUserId",
                table: "TodoLists",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TodoLists_AspNetUsers_AppUserId",
                table: "TodoLists");

            migrationBuilder.DropIndex(
                name: "IX_TodoLists_AppUserId",
                table: "TodoLists");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "TodoLists");
        }
    }
}
