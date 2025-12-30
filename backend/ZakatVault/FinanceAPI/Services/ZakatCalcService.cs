using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IZakatCalcService
{
    Task<VwZakatCalc> GetZakatCalcAsync(int userId);
}
public class ZakatCalcService(FinanceDbContext context, ILogger<ZakatCalcService> logger) : IZakatCalcService
{
    public async Task<VwZakatCalc> GetZakatCalcAsync(int userId)
    {
        // 1. Get Config
        var config = await context.ZakatConfigs.FirstOrDefaultAsync(c => c.UserId == userId) 
                        ?? new ZakatConfig { UserId = userId, BaseCurrency = "EGP", ZakatDate = DateTime.UtcNow.AddDays(355) };
        
        // 2. Determine Cycle Dates
        var currentCycle = await context.ZakatCycles
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.GregorianDate)
            .FirstOrDefaultAsync();

        DateTime zakatEndDate;
        if (currentCycle != null)
        {
            zakatEndDate = currentCycle.GregorianDate;
        }
        else
        {
            zakatEndDate = config.ZakatDate;
            while (zakatEndDate < DateTime.UtcNow.Date) 
            { 
                zakatEndDate = zakatEndDate.AddDays(355); 
            }
        }
        
        DateTime zakatStartDate = zakatEndDate.AddDays(-355);

        // 3. Fetch User Rates (System fallback)
        var rates = await context.Rates
            .Where(r => r.UserId == userId || r.UserId == null)
            .OrderByDescending(r => r.UserId)
            .ToListAsync();

        var ratesMap = rates.GroupBy(r => r.Name).ToDictionary(g => g.Key, g => g.First().Value);
        decimal goldRate = ratesMap.GetValueOrDefault("GOLD", 0);
        decimal silverRate = ratesMap.GetValueOrDefault("SILVER", 0);

        // 4. Total Debts
        var totalDebts = await context.Liabilities
            .Where(l => l.UserId == userId && l.IsDeductible && (l.DueDate == null || l.DueDate <= zakatEndDate))
            .SumAsync(l => l.Amount);

        // 5. Assets held for a year (as per original logic > 355 days)
        var transactions = await context.Transactions
            .Where(t => t.UserId == userId && t.Date <= zakatStartDate)
            .ToListAsync();

        decimal totalAssets = 0;
        foreach (var t in transactions)
        {
            if (ratesMap.TryGetValue(t.AssetType ?? "", out decimal rateValue))
            {
                var factor = t.Type.ToUpper() == "BUY" ? 1 : -1;
                totalAssets += t.Amount * rateValue * factor;
            }
        }

        var netZakatBase = Math.Max(0, totalAssets - totalDebts);
        var nisabGold = goldRate * 85.0m;
        var nisabSilver = silverRate * 595.0m;
        
        // Zakat is due if net base exceeds silver nisab (stricter) or gold nisab
        bool isZakatDue = netZakatBase >= nisabSilver;

        var zakatCalc = new VwZakatCalc
        {
            UserId = userId,
            TotalAssets = totalAssets,
            TotalDebts = totalDebts,
            NetZakatBase = netZakatBase,
            GlodAmount = goldRate > 0 ? netZakatBase / goldRate : 0,
            TotalZakatDue = isZakatDue ? netZakatBase * 0.025m : 0,
            NisabGoldValue = nisabGold,
            NisabSilverValue = nisabSilver,
            ZakatStartDate = zakatStartDate.ToString("yyyy-MM-dd"),
            LunarEndDate = zakatEndDate.ToString("yyyy-MM-dd"),
            ZakatEndDate = zakatEndDate.ToString("yyyy-MM-dd")
        };

        // 6. Payments for THIS cycle
        var totalPayments = await context.ZakatPayments
            .Where(p => p.UserId == userId && p.Date >= zakatStartDate && p.Date <= zakatEndDate)
            .SumAsync(p => p.Amount);

        zakatCalc.TotalPayments = totalPayments;
        zakatCalc.RemainingZakatDue = Math.Max(0, zakatCalc.TotalZakatDue - totalPayments);

        return zakatCalc;
    }
}
