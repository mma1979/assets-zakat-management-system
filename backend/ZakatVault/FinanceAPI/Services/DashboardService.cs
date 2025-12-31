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
        var totalAssets = await context.Transactions
            .Where(t => t.UserId == userId)
            .Join(context.Rates.Where(r => r.UserId == userId),
                  t => t.AssetType,
                  r => r.Name,
                  (t, r) => new { Transaction = t, RateValue = r.Value })
            .SumAsync(g => g.Transaction.Amount * g.RateValue * (g.Transaction.Type == TransactionType.BUY ? 1 : -1));

        var totalLiabilities = await context.Liabilities
            .Where(l => l.UserId == userId)
            .SumAsync(l => l.Amount);

        var netWorth = totalAssets - totalLiabilities;

        return new DashboardSummary
        {
            TotalAssets = totalAssets,
            TotalLiabilities = totalLiabilities,
            NetWorth = netWorth
        };
    }

    public async Task<DashboardSummary> GetDashboardSummaryAsyncV1(int userId)
    {
        var config = await context.ZakatConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        var baseCurrency = config?.BaseCurrency ?? "EGP";

        var transactions = await context.Transactions
            .Where(t => t.UserId == userId)
            .ToListAsync();

        var rates = await context.Rates
            .Where(r => r.UserId == userId)
            .ToDictionaryAsync(r => r.Name, r => r.Value);

        decimal GetRate(string? assetType)
        {
            if (string.IsNullOrEmpty(assetType) || assetType == baseCurrency) return 1.0m;
            return rates.TryGetValue(assetType, out var value) ? value : 0m;
        }

        var totalAssets = transactions
            .Sum(t => t.Amount * GetRate(t.AssetType) * (t.Type == TransactionType.BUY ? 1 : -1));

        var totalLiabilities = await context.Liabilities
            .Where(l => l.UserId == userId)
            .SumAsync(l => l.Amount);

        var netWorth = totalAssets - totalLiabilities;

        return new DashboardSummary
        {
            TotalAssets = totalAssets,
            TotalLiabilities = totalLiabilities,
            NetWorth = netWorth
        };
    }

    public async Task<List<PortfolioMetric>> GetPortfolioCompositionAsync(int userId)
    {
        var config = await context.ZakatConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        var baseCurrency = config?.BaseCurrency ?? "EGP";

        var transactions = await context.Transactions
            .Where(t => t.UserId == userId)
            .ToListAsync();

        var rates = await context.Rates
            .Where(r => r.UserId == userId)
            .ToListAsync();

        var ratesDict = rates.ToDictionary(r => r.Name, r => r);

        var portfolio = transactions
            .GroupBy(t => t.AssetType ?? baseCurrency)
            .Select(g =>
            {
                var assetKey = g.Key;
                var amount = g.Sum(t => t.Amount * (t.Type == TransactionType.BUY ? 1 : -1));
                
                decimal rateValue = 1.0m;
                string title = baseCurrency;
                if (assetKey != baseCurrency && ratesDict.TryGetValue(assetKey, out var rate))
                {
                    rateValue = rate.Value;
                    title = rate.Title;
                }

                return new PortfolioMetric
                {
                    Name = title,
                    Value = amount * rateValue,
                    Percentage = 0,
                    Color = GetAssetColor(assetKey)
                };
            })
            .Where(p => p.Value > 0.01m)
            .ToList();

        var totalPortfolio = portfolio.Sum(p => p.Value);
        if (totalPortfolio > 0)
        {
            portfolio.ForEach(p => p.Percentage = (p.Value / totalPortfolio));
        }

        return portfolio;
    }

    public async Task<List<PortfolioValueGroup>> GetPortfolioValueHistoryAsync(int userId)
    {
        var config = await context.ZakatConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        var baseCurrency = config?.BaseCurrency ?? "EGP";

        var transactions = await context.Transactions
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Date)
            .ToListAsync();

        var rates = await context.Rates
            .Where(r => r.UserId == userId)
            .ToListAsync();

        var ratesDict = rates.ToDictionary(r => r.Name, r => r);

        if (!transactions.Any()) return new List<PortfolioValueGroup>();

        var minDate = transactions.Min(t => t.Date);
        var maxDate = DateTime.UtcNow.Date;

        var dateRange = Enumerable.Range(0, (maxDate - minDate).Days + 1)
            .Select(offset => minDate.AddDays(offset).Date)
            .ToList();

        var assetGroups = transactions.GroupBy(t => t.AssetType ?? baseCurrency).ToList();
        var result = new List<PortfolioValueGroup>();

        foreach (var group in assetGroups)
        {
            var assetKey = group.Key;
            var cumulativeAmount = 0m;
            var history = new List<PortfolioValue>();
            
            decimal currentRate = 1.0m;
            string title = baseCurrency;
            if (assetKey != baseCurrency && ratesDict.TryGetValue(assetKey, out var rate))
            {
                currentRate = rate.Value;
                title = rate.Title;
            }

            foreach (var date in dateRange)
            {
                var dailyChange = group
                    .Where(t => t.Date.Date == date)
                    .Sum(t => t.Amount * (t.Type == TransactionType.BUY ? 1 : -1));
                
                cumulativeAmount += dailyChange;

                history.Add(new PortfolioValue
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Value = cumulativeAmount * currentRate
                });
            }

            if (history.Any(h => h.Value > 0.01m))
            {
                result.Add(new PortfolioValueGroup
                {
                    Title = title,
                    Color = GetAssetColor(assetKey),
                    History = history
                });
            }
        }

        return result;
    }

    
}
