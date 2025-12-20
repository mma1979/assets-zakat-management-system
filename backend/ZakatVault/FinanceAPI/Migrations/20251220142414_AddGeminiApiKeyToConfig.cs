using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddGeminiApiKeyToConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeminiApiKey",
                table: "ZakatConfigs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GeminiApiKey",
                table: "ZakatConfigs");
        }
    }
}
