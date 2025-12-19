using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Hangfire;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IRatesService
{
    Task<List<RateResponse>> GetLatestRatesAsync();
    Task<List<RateResponse>> UpdateRatesAsync(List<RateRequest> rates);
    void UpdateRates();
    Task<List<RateResponse>> AddRateAsync(RateItem rate);
    Task<List<RateResponse>> DeleteRateAsync(int id);
    Task<List<RateResponse>> ReorderRatesAsync(List<RateReorderRequest> rates);
}
public class RatesService(FinanceDbContext context, IGeminiService geminiService) : IRatesService
{
    public async Task<List<RateResponse>> GetLatestRatesAsync()
    {
        var rates = await context.Rates
            .AsNoTracking()
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

    public async Task<List<RateResponse>> UpdateRatesAsync(List<RateRequest> rates)
    {
        var lastUpdates = DateTime.UtcNow;

        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Value, rate.value)
                .SetProperty(rr => rr.LastUpdated, lastUpdates)
            );
        });

        BackgroundJob.Enqueue<INotificationService>(QueuesNames.NOTIFICATIONS, ns => ns.SendPriceAlert());

        return await GetLatestRatesAsync();
    }

    public void UpdateRates()
    {
        // use gemini api to get latest rates and update the database

        var rates = geminiService.FetchMarketRatesAsync().GetAwaiter().GetResult();
        if (rates == null)
        {
            return;
        }

        var lastUpdates = DateTime.UtcNow;

        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Value, rate.value)
                .SetProperty(rr => rr.LastUpdated, lastUpdates)
            );
        });

        
        BackgroundJob.Enqueue<INotificationService>(QueuesNames.NOTIFICATIONS, ns => ns.SendPriceAlert());
    }

    public async Task<List<RateResponse>> AddRateAsync(RateItem rate)
    {
        var newRate = new Rate
        {
            Name = rate.key,
            Value = rate.value,
            Icon = rate.icon,
            Title = rate.title,
            LastUpdated = DateTime.UtcNow
        };

        await context.Rates.AddAsync(newRate);
        await context.SaveChangesAsync();
        return await GetLatestRatesAsync();
    }

    public async Task<List<RateResponse>> DeleteRateAsync(int id)
    {
        var txs = await context.Transactions
            .Where(t => context.Rates.Any(r => r.Id == id && r.Name == t.AssetType))
            .ToListAsync();

        context.Transactions.RemoveRange(txs);
        await context.SaveChangesAsync();

        await context.Rates
            .Where(r => r.Id == id)
            .ExecuteDeleteAsync();

        return await GetLatestRatesAsync();
    }

    public async Task<List<RateResponse>> ReorderRatesAsync(List<RateReorderRequest> rates)
    {
        rates.ForEach(rate =>
        {
            context.Rates.Where(e => e.Id == rate.id).ExecuteUpdate(r => r
                .SetProperty(rr => rr.Order, rate.order)
            );
        });


        return await GetLatestRatesAsync();
    }
}



