using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Hangfire;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IRatesService
{
    Task<List<RateResponse>> GetLatestRatesAsync(int userId);
    Task<List<RateResponse>> UpdateRatesAsync(int userId, List<RateRequest> rates);
    void UpdateRates(int? userId = null);
    Task<List<RateResponse>> AddRateAsync(int userId, RateItem rate);
    Task<List<RateResponse>> DeleteRateAsync(int userId, int id);
    Task<List<RateResponse>> ReorderRatesAsync(int userId, List<RateReorderRequest> rates);
}
public class RatesService(FinanceDbContext context, IGeminiService geminiService) : IRatesService
{
    public async Task<List<RateResponse>> GetLatestRatesAsync(int userId)
    {
        var rates = await context.Rates
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Order)
            .Select(r => new RateResponse
            {
                id = r.Id,
                key = r.Name,
                value = r.Value,
                lastUpdated = r.LastUpdated,
                icon = r.Icon,
                title = r.Title,
                order = r.Order
            }).ToListAsync();

        return rates ?? [];
    }

    public async Task<List<RateResponse>> UpdateRatesAsync(int userId, List<RateRequest> rates)
    {
        var lastUpdates = DateTime.UtcNow;

        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id && e.UserId == userId).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Value, rate.value)
                .SetProperty(rr => rr.LastUpdated, lastUpdates)
            );
        });

        BackgroundJob.Enqueue<INotificationService>(QueuesNames.NOTIFICATIONS, ns => ns.SendPriceAlert());

        return await GetLatestRatesAsync(userId);
    }

    public void UpdateRates(int? userId = null)
    {
        // use gemini api to get latest rates and update the database
        // obtain the base currency from user config if userId is provided
        string baseCurrency = "EGP";
        if (userId.HasValue)
        {
            var config = context.ZakatConfigs.FirstOrDefault(c => c.UserId == userId.Value);
            if (config != null) baseCurrency = config.BaseCurrency;
        }

        var rates = geminiService.FetchMarketRatesAsync(baseCurrency).GetAwaiter().GetResult();
        if (rates == null)
        {
            return;
        }

        var lastUpdates = DateTime.UtcNow;

        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id && (userId == null || e.UserId == userId)).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Value, rate.value)
                .SetProperty(rr => rr.LastUpdated, lastUpdates)
            );
        });

        
        BackgroundJob.Enqueue<INotificationService>(QueuesNames.NOTIFICATIONS, ns => ns.SendPriceAlert());
    }

    public async Task<List<RateResponse>> AddRateAsync(int userId, RateItem rate)
    {
        var newRate = new Rate
        {
            UserId = userId,
            Name = rate.key,
            Value = rate.value,
            Icon = rate.icon,
            Title = rate.title,
            LastUpdated = DateTime.UtcNow
        };

        await context.Rates.AddAsync(newRate);
        await context.SaveChangesAsync();
        return await GetLatestRatesAsync(userId);
    }

    public async Task<List<RateResponse>> DeleteRateAsync(int userId, int id)
    {
        var txs = await context.Transactions
            .Where(t => t.UserId == userId && context.Rates.Any(r => r.Id == id && r.Name == t.AssetType && r.UserId == userId))
            .ToListAsync();

        context.Transactions.RemoveRange(txs);
        await context.SaveChangesAsync();

        await context.Rates
            .Where(r => r.Id == id && r.UserId == userId)
            .ExecuteDeleteAsync();

        return await GetLatestRatesAsync(userId);
    }

    public async Task<List<RateResponse>> ReorderRatesAsync(int userId, List<RateReorderRequest> rates)
    {
        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id && e.UserId == userId).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Order, rate.order)
            );
        });


        return await GetLatestRatesAsync(userId);
    }
}



