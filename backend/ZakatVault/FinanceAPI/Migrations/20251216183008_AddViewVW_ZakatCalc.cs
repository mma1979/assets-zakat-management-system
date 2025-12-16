using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddViewVW_ZakatCalc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder mb)
        {
            mb.Sql("""
                                CREATE OR ALTER View dbo.VW_ZakatCalc
                AS

                With debts as (select UserId, sum(amount) TotalDebts
                from Liabilities where DueDate <= (Select top 1 z.ZakatDate from ZakatConfigs z where z.UserId=UserId) 
                group by UserId),

                credits as (select UserId,t.AssetType, sum(t.amount * r.Value) CurrentValue
                from Transactions t
                JOIN Rates r on t.AssetType = r.Name
                where Type='Buy' and DATEDIFF(day,[date],getdate()) >=355
                group by UserId,t.AssetType),

                aggregations as 
                (select UserId, 0 as TotalCredits,TotalDebts from debts
                union
                select UserId, Sum(CurrentValue) TotalCredits, 0 TotalDebts from credits group by UserId),
                net as(select 
                UserId, SUM(TotalCredits) TotalCredits, SUM(TotalDebts) TotalDebts,
                SUM(TotalCredits) - SUM(TotalDebts) NetWorth,(Select top 1 Value From Rates Where Name='GOLD') Gold
                from aggregations
                group by UserId)

                Select UserId,TotalCredits TotalAssets,TotalDebts,NetWorth NetZakatBase,
                NetWorth/Gold as GlodAmount, NetWorth*.025 as TotalZakatDue
                From net
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder mb)
        {
            mb.Sql("DROP VIEW IF EXISTS dbo.VW_ZakatCalc");
        }
    }
}
