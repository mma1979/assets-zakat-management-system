using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddVW_Rates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder mb)
        {
            mb.Sql("""
                                CREATE OR ALTER VIEW dbo.VW_Rates
                AS
                SELECT
                   [GOLD] gold_egp, [GOLD_21] gold21_egp, [SILVER] silver_egp, [USD] usd_egp, [EGP] egp,LastUpdated
                FROM (
                    SELECT Name, Value, LastUpdated
                    FROM Rates
                ) AS src
                PIVOT (
                    MAX(Value) FOR Name IN ([GOLD], [GOLD_21], [SILVER], [USD], [EGP])
                ) AS p;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder mb)
        {
            mb.Sql("DROP VIEW IF EXISTS dbo.VW_Rates;");
        }
    }
}
