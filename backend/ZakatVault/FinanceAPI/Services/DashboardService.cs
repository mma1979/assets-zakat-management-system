using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IDashboardService
{
    Task<DashboardSummary> GetDashboardSummaryAsync(int userId);
    Task<List<PortfolioMetric>> GetPortfolioCompositionAsync(int userId);
}

public class DashboardService(FinanceDbContext context) : IDashboardService
{
    public async Task<DashboardSummary> GetDashboardSummaryAsync(int userId)
    {
        var totalBuy = await context.Transactions
             .Where(t => t.UserId == userId && t.Type == TransactionType.BUY)
             .Join(context.Rates,
                  t => t.AssetType,
                  r => r.Name,
                  (t, r) => new
                  {
                      t.UserId,
                      t.Amount,
                      PricePerUnit = r.Value
                  })
            .SumAsync(t => t.Amount * t.PricePerUnit);

        var totalSell = await context.Transactions
             .Where(t => t.UserId == userId && t.Type == TransactionType.SELL)
             .Join(context.Rates,
                  t => t.AssetType,
                  r => r.Name,
                  (t, r) => new
                  {
                      t.UserId,
                      t.Amount,
                      PricePerUnit = r.Value
                  })
            .SumAsync(t => t.Amount * t.PricePerUnit);

        var totalLiabilities = await context.Liabilities
            .Where(l => l.UserId == userId)
            .SumAsync(l => l.Amount);

        var totalAssets = totalBuy - totalSell;
        var netWorth = totalAssets - totalLiabilities;

        var summary = new DashboardSummary
        {
            TotalAssets = totalAssets,
            TotalLiabilities = totalLiabilities,
            NetWorth = netWorth
        };

        return summary;
    }

    public async Task<List<PortfolioMetric>> GetPortfolioCompositionAsync(int userId)
    {

        Func<string, string> getAssetColor = assetType => assetType switch
        {
            "GOLD" => "#fbbf24",
            "GOLD_21" => "#f59e0b",
            "SILVER" => "#94a3b8",
            "USD" => "#10b981",
            "EGP" => "#3b82f6",
            _ => "#607d8b"
        };
        // current value of the portfolio
        var portfolio = await context.Transactions
             .Where(t => t.UserId == userId)
             .Join(context.Rates,
                  t => t.AssetType,
                  r => r.Name,
                  (t, r) => new
                  {
                      Value = t.Amount * r.Value * (t.Type == TransactionType.BUY ? 1 : -1),
                      Name = r.Title,
                      Key = r.Name
                  }).GroupBy(t => t.Name)
                  .Select(g => new PortfolioMetric
                  {
                      Name = g.Key,
                      Value = g.Sum(x => x.Value),
                      Percentage = 0,
                      Color = getAssetColor(g.First().Key)

                  }).ToListAsync();

        return portfolio;


    }
}
