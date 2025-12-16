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
            return new VwZakatCalc();
        }
        return zakatCalc;

    }
}
