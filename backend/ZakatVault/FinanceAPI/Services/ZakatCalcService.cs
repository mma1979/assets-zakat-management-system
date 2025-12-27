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
        var zakatCalc = await context.VwZakatCalc
            .FirstOrDefaultAsync(z => z.UserId == userId);
        
        if (zakatCalc == null)
        {
            logger.LogWarning("Zakat calculation not found for user ID {UserId}", userId);
            zakatCalc = new VwZakatCalc { UserId = userId };
        }

        // Determine the current Zakat year window
        var zakatConfig = await context.ZakatConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId);

        DateTime zakatEndDate = zakatConfig?.ZakatDate ?? DateTime.UtcNow.AddDays(355);
        
        // If the date is in the deep past, advance it to the current/next cycle
        while (zakatEndDate < DateTime.UtcNow.Date)
        {
            zakatEndDate = zakatEndDate.AddDays(355);
        }

        DateTime zakatStartDate = zakatEndDate.AddDays(-355);

        var totalPayments = await context.ZakatPayments
            .Where(p => p.UserId == userId && p.Date >= zakatStartDate && p.Date <= zakatEndDate)
            .SumAsync(p => p.Amount);

        zakatCalc.TotalPayments = totalPayments;
        zakatCalc.RemainingZakatDue = Math.Max(0, zakatCalc.TotalZakatDue - totalPayments);
        zakatCalc.LunarEndDate = zakatEndDate.ToString("yyyy-MM-dd");

        return zakatCalc;
    }
}
