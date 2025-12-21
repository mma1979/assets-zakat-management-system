using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IDashboardService
{
    Task<DashboardSummary> GetDashboardSummaryAsync(int userId);
}

public class DashboardService(FinanceDbContext context): IDashboardService
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
}
