using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddZakatStartDateToVwZakatCalc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder mb)
        {
            mb.Sql("""
ALTER View [dbo].[VW_ZakatCalc]
AS
WITH UserDates AS (
    SELECT 
        u.Id AS UserId,
        COALESCE(
            (SELECT TOP 1 GregorianDate FROM ZakatCycles zc WHERE zc.UserId = u.Id ORDER BY GregorianDate DESC),
            (SELECT TOP 1 ZakatDate FROM ZakatConfigs zcf WHERE zcf.UserId = u.Id),
            GETDATE()
        ) AS ZakatEndDate
    FROM Users u
),
UserWindow AS (
    SELECT 
        UserId,
        ZakatEndDate,
        DATEADD(day, -355, ZakatEndDate) AS ZakatStartDate
    FROM UserDates
),
debts AS (
    SELECT l.UserId, SUM(l.Amount) AS TotalDebts
    FROM Liabilities l
    JOIN UserWindow uw ON l.UserId = uw.UserId
    WHERE l.IsDeductible = 1 AND (l.DueDate IS NULL OR l.DueDate <= uw.ZakatEndDate)
    GROUP BY l.UserId
),
credits_plus AS (
    SELECT t.UserId, t.AssetType, SUM(t.Amount * r.Value) AS CurrentValue
    FROM Transactions t
    JOIN UserWindow uw ON t.UserId = uw.UserId
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = t.AssetType AND (UserId = t.UserId OR UserId IS NULL) ORDER BY UserId DESC
    ) r
    WHERE t.Type = 'Buy' AND t.Date <= uw.ZakatStartDate
    GROUP BY t.UserId, t.AssetType
),
credits_minus AS (
    SELECT t.UserId, t.AssetType, SUM(t.Amount * r.Value) AS CurrentValue
    FROM Transactions t
    JOIN UserWindow uw ON t.UserId = uw.UserId
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = t.AssetType AND (UserId = t.UserId OR UserId IS NULL) ORDER BY UserId DESC
    ) r
    WHERE t.Type = 'Sell' AND t.Date <= uw.ZakatStartDate
    GROUP BY t.UserId, t.AssetType
),
aggregations AS (
    SELECT UserId, 0 AS TotalCredits, TotalDebts FROM debts
    UNION ALL
    SELECT UserId, SUM(CurrentValue) AS TotalCredits, 0 AS TotalDebts FROM credits_plus GROUP BY UserId
    UNION ALL
    SELECT UserId, SUM(CurrentValue) * -1 AS TotalCredits, 0 AS TotalDebts FROM credits_minus GROUP BY UserId
),
net AS (
    SELECT 
        agg.UserId, 
        SUM(agg.TotalCredits) AS TotalAssets, 
        SUM(agg.TotalDebts) AS TotalDebts,
        SUM(agg.TotalCredits) - SUM(agg.TotalDebts) AS NetZakatBase,
        uw.ZakatEndDate,
        uw.ZakatStartDate
    FROM aggregations agg
    JOIN UserWindow uw ON agg.UserId = uw.UserId
    GROUP BY agg.UserId, uw.ZakatEndDate, uw.ZakatStartDate
),
gold_rates AS (
    SELECT u.Id AS UserId, r.Value AS GoldValue
    FROM Users u
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = 'GOLD' AND (UserId = u.Id OR UserId IS NULL) ORDER BY UserId DESC
    ) r
),
silver_rates AS (
    SELECT u.Id AS UserId, r.Value AS SilverValue
    FROM Users u
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = 'SILVER' AND (UserId = u.Id OR UserId IS NULL) ORDER BY UserId DESC
    ) r
),
payments AS (
    SELECT p.UserId, SUM(p.Amount) AS TotalPayments
    FROM ZakatPayments p
    JOIN UserWindow uw ON p.UserId = uw.UserId
    WHERE p.Date >= uw.ZakatStartDate AND p.Date <= uw.ZakatEndDate
    GROUP BY p.UserId
)
SELECT 
    n.UserId,
    n.TotalAssets,
    n.TotalDebts,
    CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END AS NetZakatBase,
    CASE WHEN gr.GoldValue > 0 THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) / gr.GoldValue ELSE 0 END AS GlodAmount,
    CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END AS TotalZakatDue,
    COALESCE(p.TotalPayments, 0) AS TotalPayments,
    CASE 
        WHEN (CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END) - COALESCE(p.TotalPayments, 0) > 0 
        THEN (CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END) - COALESCE(p.TotalPayments, 0) 
        ELSE 0 
    END AS RemainingZakatDue,
    gr.GoldValue * 85.0 AS NisabGoldValue,
    sr.SilverValue * 595.0 AS NisabSilverValue,
    FORMAT(n.ZakatStartDate, 'dd-MM-yyyy', 'ar-EG') AS ZakatStartDate,
    FORMAT(n.ZakatEndDate, 'dd-MM-yyyy', 'ar-SA') AS LunarEndDate,
    FORMAT(n.ZakatEndDate, 'dd-MM-yyyy', 'ar-EG') AS ZakatEndDate
FROM net n
JOIN gold_rates gr ON n.UserId = gr.UserId
JOIN silver_rates sr ON n.UserId = sr.UserId
LEFT JOIN payments p ON n.UserId = p.UserId
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder mb)
        {
            mb.Sql("""
ALTER View [dbo].[VW_ZakatCalc]
AS
WITH UserDates AS (
    SELECT 
        u.Id AS UserId,
        COALESCE(
            (SELECT TOP 1 GregorianDate FROM ZakatCycles zc WHERE zc.UserId = u.Id ORDER BY GregorianDate DESC),
            (SELECT TOP 1 ZakatDate FROM ZakatConfigs zcf WHERE zcf.UserId = u.Id),
            GETDATE()
        ) AS ZakatEndDate
    FROM Users u
),
UserWindow AS (
    SELECT 
        UserId,
        ZakatEndDate,
        DATEADD(day, -355, ZakatEndDate) AS ZakatStartDate
    FROM UserDates
),
debts AS (
    SELECT l.UserId, SUM(l.Amount) AS TotalDebts
    FROM Liabilities l
    JOIN UserWindow uw ON l.UserId = uw.UserId
    WHERE l.IsDeductible = 1 AND (l.DueDate IS NULL OR l.DueDate <= uw.ZakatEndDate)
    GROUP BY l.UserId
),
credits_plus AS (
    SELECT t.UserId, t.AssetType, SUM(t.Amount * r.Value) AS CurrentValue
    FROM Transactions t
    JOIN UserWindow uw ON t.UserId = uw.UserId
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = t.AssetType AND (UserId = t.UserId OR UserId IS NULL) ORDER BY UserId DESC
    ) r
    WHERE t.Type = 'Buy' AND t.Date <= uw.ZakatStartDate
    GROUP BY t.UserId, t.AssetType
),
credits_minus AS (
    SELECT t.UserId, t.AssetType, SUM(t.Amount * r.Value) AS CurrentValue
    FROM Transactions t
    JOIN UserWindow uw ON t.UserId = uw.UserId
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = t.AssetType AND (UserId = t.UserId OR UserId IS NULL) ORDER BY UserId DESC
    ) r
    WHERE t.Type = 'Sell' AND t.Date <= uw.ZakatStartDate
    GROUP BY t.UserId, t.AssetType
),
aggregations AS (
    SELECT UserId, 0 AS TotalCredits, TotalDebts FROM debts
    UNION ALL
    SELECT UserId, SUM(CurrentValue) AS TotalCredits, 0 AS TotalDebts FROM credits_plus GROUP BY UserId
    UNION ALL
    SELECT UserId, SUM(CurrentValue) * -1 AS TotalCredits, 0 AS TotalDebts FROM credits_minus GROUP BY UserId
),
net AS (
    SELECT 
        agg.UserId, 
        SUM(agg.TotalCredits) AS TotalAssets, 
        SUM(agg.TotalDebts) AS TotalDebts,
        SUM(agg.TotalCredits) - SUM(agg.TotalDebts) AS NetZakatBase,
        uw.ZakatEndDate,
        uw.ZakatStartDate
    FROM aggregations agg
    JOIN UserWindow uw ON agg.UserId = uw.UserId
    GROUP BY agg.UserId, uw.ZakatEndDate, uw.ZakatStartDate
),
gold_rates AS (
    SELECT u.Id AS UserId, r.Value AS GoldValue
    FROM Users u
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = 'GOLD' AND (UserId = u.Id OR UserId IS NULL) ORDER BY UserId DESC
    ) r
),
silver_rates AS (
    SELECT u.Id AS UserId, r.Value AS SilverValue
    FROM Users u
    CROSS APPLY (
        SELECT TOP 1 Value FROM Rates WHERE Name = 'SILVER' AND (UserId = u.Id OR UserId IS NULL) ORDER BY UserId DESC
    ) r
),
payments AS (
    SELECT p.UserId, SUM(p.Amount) AS TotalPayments
    FROM ZakatPayments p
    JOIN UserWindow uw ON p.UserId = uw.UserId
    WHERE p.Date >= uw.ZakatStartDate AND p.Date <= uw.ZakatEndDate
    GROUP BY p.UserId
)
SELECT 
    n.UserId,
    n.TotalAssets,
    n.TotalDebts,
    CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END AS NetZakatBase,
    CASE WHEN gr.GoldValue > 0 THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) / gr.GoldValue ELSE 0 END AS GlodAmount,
    CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END AS TotalZakatDue,
    COALESCE(p.TotalPayments, 0) AS TotalPayments,
    CASE 
        WHEN (CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END) - COALESCE(p.TotalPayments, 0) > 0 
        THEN (CASE WHEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) >= (sr.SilverValue * 595.0) THEN (CASE WHEN n.NetZakatBase > 0 THEN n.NetZakatBase ELSE 0 END) * 0.025 ELSE 0 END) - COALESCE(p.TotalPayments, 0) 
        ELSE 0 
    END AS RemainingZakatDue,
    gr.GoldValue * 85.0 AS NisabGoldValue,
    sr.SilverValue * 595.0 AS NisabSilverValue,
    FORMAT(n.ZakatEndDate, 'dd-MM-yyyy', 'ar-SA') AS LunarEndDate,
    FORMAT(n.ZakatEndDate, 'dd-MM-yyyy', 'ar-EG') AS ZakatEndDate
FROM net n
JOIN gold_rates gr ON n.UserId = gr.UserId
JOIN silver_rates sr ON n.UserId = sr.UserId
LEFT JOIN payments p ON n.UserId = p.UserId
""");
        }
    }
}
