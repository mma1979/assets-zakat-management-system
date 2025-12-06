using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IRatesService
{
    Task<RatesResponse> GetLatestRatesAsync();
    Task<RatesResponse> UpdateRatesAsync(RatesRequest rates);
}
public class RatesService(FinanceDbContext context) : IRatesService
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

        return await GetLatestRatesAsync();
    }
}



