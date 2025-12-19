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
}
public class RatesService(FinanceDbContext context, IGeminiService geminiService) : IRatesService
{
    public async Task<List<RateResponse>> GetLatestRatesAsync()
    {
        var rates = await context.Rates
            .Select(r => new RateResponse
            {
                id = r.Id,
                key = r.Name,
                value = r.Value,
                lastUpdated = r.LastUpdated,
                icon = r.Icon,
                title = r.Title
            }).ToListAsync();

        return rates ?? [] ;
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
        context.Rates.Where(r => r.Name == "GOLD").ExecuteUpdate(r => r
            .SetProperty(r => r.Value, rates.gold_egp)
            .SetProperty(r => r.LastUpdated, lastUpdates)
        );

        context.Rates.Where(r => r.Name == "GOLD_21").ExecuteUpdate(r => r
            .SetProperty(r => r.Value, rates.gold21_egp)
            .SetProperty(r => r.LastUpdated, lastUpdates)
        );

        context.Rates.Where(r => r.Name == "SILVER").ExecuteUpdate(r => r
            .SetProperty(r => r.Value, rates.silver_egp)
            .SetProperty(r => r.LastUpdated, lastUpdates)
        );

        context.Rates.Where(r => r.Name == "USD").ExecuteUpdate(r => r
            .SetProperty(r => r.Value, rates.usd_egp)
            .SetProperty(r => r.LastUpdated, lastUpdates)
        );

        context.Rates.Where(r => r.Name == "EGP").ExecuteUpdate(r => r
           .SetProperty(r => r.LastUpdated, lastUpdates)
       );

        BackgroundJob.Enqueue<INotificationService>(QueuesNames.NOTIFICATIONS,ns => ns.SendPriceAlert());
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
}



