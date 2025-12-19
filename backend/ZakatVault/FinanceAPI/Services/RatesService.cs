using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Hangfire;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IRatesService
{
    Task<RatesResponse> GetLatestRatesAsync();
    Task<RatesResponse> UpdateRatesAsync(RatesRequest rates);
    void UpdateRates();
    Task<RatesResponse> AddRateAsync(RateItem rate);
}
public class RatesService(FinanceDbContext context, IGeminiService geminiService) : IRatesService
{
    public async Task<RatesResponse> GetLatestRatesAsync()
    {
        var rates = await context.ViewRates
            .Select(r => new RatesResponse
            {
                gold_egp = r.gold_egp,
                gold21_egp = r.gold21_egp,
                silver_egp = r.silver_egp,
                usd_egp = r.usd_egp,
                egp = r.egp,
                lastUpdated = r.LastUpdated,
                dataSources = Array.Empty<object>()
            }).FirstOrDefaultAsync();

        return rates ?? new RatesResponse() ;
    }

    public async Task<RatesResponse> UpdateRatesAsync(RatesRequest rates)
    {
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

    public async Task<RatesResponse> AddRateAsync(RateItem rate)
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



