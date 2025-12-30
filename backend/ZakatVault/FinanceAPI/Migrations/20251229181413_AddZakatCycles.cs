using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddZakatCycles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ZakatAnniversaryDay",
                table: "ZakatConfigs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ZakatAnniversaryMonth",
                table: "ZakatConfigs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ZakatCycles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    HijriYear = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GregorianDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalAssets = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalLiabilities = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ZakatDue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZakatCycles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZakatCycles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ZakatCycles_UserId",
                table: "ZakatCycles",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ZakatCycles");

            migrationBuilder.DropColumn(
                name: "ZakatAnniversaryDay",
                table: "ZakatConfigs");

            migrationBuilder.DropColumn(
                name: "ZakatAnniversaryMonth",
                table: "ZakatConfigs");
        }
    }
}
