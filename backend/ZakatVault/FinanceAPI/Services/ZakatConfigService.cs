using FinanceAPI.Data;
using FinanceAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IZakatConfigService
{
    Task<ZakatConfig> GetZakatConfigAsync(int? userId);
}

public class ZakatConfigService(FinanceDbContext context) : IZakatConfigService
{
    public async Task<ZakatConfig> GetZakatConfigAsync(int? userId)
    {
        var config = await context.ZakatConfigs
            .FirstOrDefaultAsync(z => z.UserId == userId);
        return config ?? new();
    }
}
