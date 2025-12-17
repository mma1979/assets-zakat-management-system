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

                credits_plus as (select UserId,t.AssetType, sum(t.amount * r.Value) CurrentValue
                from Transactions t
                JOIN Rates r on t.AssetType = r.Name
                where Type='Buy' and DATEDIFF(day,[date],getdate()) >=355
                group by UserId,t.AssetType),

                credits_minues as (select UserId,t.AssetType, sum(t.amount * r.Value) CurrentValue
                from Transactions t
                JOIN Rates r on t.AssetType = r.Name
                where Type='SELL' and DATEDIFF(day,[date],getdate()) >=355
                group by UserId,t.AssetType),

                aggregations as 
                (select UserId, 0 as TotalCredits,TotalDebts from debts
                union
                select UserId, Sum(CurrentValue) TotalCredits, 0 TotalDebts from credits_plus group by UserId
                union
                select UserId, Sum(CurrentValue)*-1 TotalCredits, 0 TotalDebts from credits_minues group by UserId),
                net as(select 
                UserId, SUM(TotalCredits) TotalCredits, SUM(TotalDebts) TotalDebts,
                SUM(TotalCredits) - SUM(TotalDebts) NetWorth,(Select top 1 Value From Rates Where Name='GOLD') Gold
                from aggregations
                group by UserId),
                gold_nisab as (select top 1 (gold_egp * 85.0) NisabGoldValue from VW_Rates),
                silver_nisab as (select top 1 (silver_egp * 595.0) NisabSilverValue from VW_Rates)

                Select UserId,TotalCredits TotalAssets,TotalDebts,NetWorth NetZakatBase,
                NetWorth/Gold as GlodAmount, NetWorth*.025 as TotalZakatDue,
                (select top 1 NisabGoldValue from gold_nisab) NisabGoldValue,
                (select top 1 NisabSilverValue from silver_nisab) NisabSilverValue,
                FORMAT((Select top 1 z.ZakatDate from ZakatConfigs z where z.UserId=UserId), 'dd-MM-yyyy', 'ar-SA') as LunarEndDate
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
