using FinanceAPI.Data;
using FinanceAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IZakatConfigService
{
    Task<ZakatConfig> AddZakatConfigAsync(int userId, ZakatConfigRequest configRequest);
    Task<ZakatConfig> GetZakatConfigAsync(int? userId);
    Task<ZakatConfig> UpdateZakatConfigAsync(int? userId, ZakatConfigRequest configRequest);
}

public class ZakatConfigService(FinanceDbContext context) : IZakatConfigService
{
    public async Task<ZakatConfig> GetZakatConfigAsync(int? userId)
    {
        var config = await context.ZakatConfigs.AsNoTracking()
            .FirstOrDefaultAsync(z => z.UserId == userId);
        return config ?? new();
    }

    public async Task<ZakatConfig> UpdateZakatConfigAsync(int? userId, ZakatConfigRequest configRequest)
    {
        var config = await context.ZakatConfigs
            .FirstOrDefaultAsync(z => z.UserId == userId);
        if (config == null)
        {
            throw new KeyNotFoundException("Zakat configuration not found.");
        }
        config.ZakatDate = configRequest.ZakatDate;
        config.ReminderEnabled = configRequest.ReminderEnabled;
        config.Email = configRequest.Email;
        config.GeminiApiKey = configRequest.GeminiApiKey;
        config.BaseCurrency = configRequest.BaseCurrency ?? config.BaseCurrency;
        config.ZakatAnniversaryDay = configRequest.ZakatAnniversaryDay;
        config.ZakatAnniversaryMonth = configRequest.ZakatAnniversaryMonth;

        await context.SaveChangesAsync();

        return await GetZakatConfigAsync(userId);
    }

    public async Task<ZakatConfig> AddZakatConfigAsync(int userId, ZakatConfigRequest configRequest)
    {
        var zakatConfig = new ZakatConfig
        {
            UserId = userId,
            ZakatDate = configRequest.ZakatDate,
            ReminderEnabled = configRequest.ReminderEnabled,
            Email = configRequest.Email,
            GeminiApiKey = configRequest.GeminiApiKey,
            BaseCurrency = configRequest.BaseCurrency ?? "EGP",
            ZakatAnniversaryDay = configRequest.ZakatAnniversaryDay,
            ZakatAnniversaryMonth = configRequest.ZakatAnniversaryMonth
        };

         await context.ZakatConfigs.AddAsync(zakatConfig);
            await context.SaveChangesAsync();
        return await GetZakatConfigAsync(userId);
    }
}
