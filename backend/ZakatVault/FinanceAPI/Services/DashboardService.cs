using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

using Newtonsoft.Json.Linq;

using System.Net.NetworkInformation;

namespace FinanceAPI.Services;

public interface IDashboardService
{
    Task<DashboardSummary> GetDashboardSummaryAsync(int userId);
    Task<List<PortfolioMetric>> GetPortfolioCompositionAsync(int userId);
    Task<List<PortfolioValueGroup>> GetPortfolioValueHistoryAsync(int userId);
}

public class DashboardService(FinanceDbContext context) : IDashboardService
{
    private static string GetAssetColor(string assetKey)
    {
        return assetKey.ToLower() switch
        {
            "bitcoin" => "#f2a900",
            "ethereum" => "#3c3c3d",
            "tether" => "#26a17b",
            "binancecoin" => "#f3ba2f",
            "ripple" => "#346aa9",
            "cardano" => "#0033ad",
            "solana" => "#00ffa3",
            "polkadot" => "#e6007a",
            "dogecoin" => "#c2a633",
            "gold" => "#fbbf24",
            "gold_21" => "#f59e0b",
            "silver" => "#94a3b8",
            "usd" => "#10b981",
            "egp" => "#3b82f6",
            _ => "#888888", // Default gray color
        };
    }

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
                      Color = GetAssetColor(g.First().Key)

                  }).ToListAsync();
        var totalPortfolio = portfolio.Sum(p => p.Value);
        portfolio.ForEach(p => p.Percentage = p.Value / totalPortfolio);

        return portfolio;


    }

    public async Task<List<PortfolioValueGroup>> GetPortfolioValueHistoryAsync(int userId)
    {
        var portfolio = (await context.Transactions
            .Where(t => t.UserId == userId)
            .Join(context.Rates,
                 t => t.AssetType,
                 r => r.Name,
                 (t, r) => new
                 {
                     Amount = t.Amount,
                     RateValue = r.Value,
                     Type = t.Type,
                     Date = t.Date, // Keep as DateTime
                     Key = r.Name,
                     Title = r.Title
                 })
            .ToListAsync()) // Materialize to memory first
            .Select(t => new
            {
                Value = t.Amount * t.RateValue * (t.Type == TransactionType.BUY ? 1 : -1),
                Date = t.Date.ToString("yyyy-MM-dd"), // Now do string conversion in memory
                Key = t.Key,
                Title = t.Title
            })
            .GroupBy(t => new { t.Title, t.Key })
            .Select(g => new PortfolioValueGroup
            {
                Title = g.Key.Title,
                Color = GetAssetColor(g.Key.Key),
                History = g.GroupBy(x => x.Date)
                            .Select(dg => new PortfolioValue
                            {
                                Date = dg.Key,
                                Value = dg.Sum(x => x.Value)
                            })
                            .OrderBy(h => h.Date)
                            .ToList()
            })
            .ToList();

        return portfolio;
    }
}
