using FinanceAPI.Data;
using FinanceAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FinanceAPI.Services;

public interface IZakatConfigService
{
    Task<ZakatConfig> AddZakatConfigAsync(int userId, ZakatConfigRequest configRequest);
    Task<ZakatConfig> GetZakatConfigAsync(int? userId);
    Task<ZakatConfig> UpdateZakatConfigAsync(int? userId, ZakatConfigRequest configRequest);
}

public class ZakatConfigService(FinanceDbContext context, IZakatCycleService cycleService, ILiabilityService liabilityService) : IZakatConfigService
{
    private readonly UmAlQuraCalendar _hijriCalendar = new UmAlQuraCalendar();

    public async Task<ZakatConfig> GetZakatConfigAsync(int? userId)
    {
        var config = await context.ZakatConfigs.AsNoTracking()
            .FirstOrDefaultAsync(z => z.UserId == userId);
        return config ?? new();
    }

    public async Task<ZakatConfig> UpdateZakatConfigAsync(int? userId, ZakatConfigRequest configRequest)
    {
        if (userId == null) throw new ArgumentNullException(nameof(userId));

        var config = await context.ZakatConfigs
            .FirstOrDefaultAsync(z => z.UserId == userId);
        if (config == null)
        {
            throw new KeyNotFoundException("Zakat configuration not found.");
        }

        // Handle bidirectional date conversion
        if (configRequest.ZakatDate != config.ZakatDate)
        {
            // Gregorian updated -> Update Hijri parts
            config.ZakatDate = configRequest.ZakatDate;
            config.ZakatAnniversaryDay = _hijriCalendar.GetDayOfMonth(config.ZakatDate);
            config.ZakatAnniversaryMonth = _hijriCalendar.GetMonth(config.ZakatDate);
        }
        else if (configRequest.ZakatAnniversaryDay != config.ZakatAnniversaryDay || configRequest.ZakatAnniversaryMonth != config.ZakatAnniversaryMonth)
        {
            // Hijri updated -> Update Gregorian (we use current Hijri year to find next occurrence)
            config.ZakatAnniversaryDay = configRequest.ZakatAnniversaryDay;
            config.ZakatAnniversaryMonth = configRequest.ZakatAnniversaryMonth;
            
            if (config.ZakatAnniversaryDay != null && config.ZakatAnniversaryMonth != null)
            {
                int currentHijriYear = _hijriCalendar.GetYear(DateTime.UtcNow);
                config.ZakatDate = GetNextHijriOccurrence(currentHijriYear, config.ZakatAnniversaryMonth.Value, config.ZakatAnniversaryDay.Value);
            }
        }

        config.ReminderEnabled = configRequest.ReminderEnabled;
        config.Email = configRequest.Email;
        config.GeminiApiKey = configRequest.GeminiApiKey;
        config.BaseCurrency = configRequest.BaseCurrency ?? config.BaseCurrency;

        await context.SaveChangesAsync();
        await cycleService.RecalculateUserCyclesAsync(userId.Value);
        await liabilityService.RecalculateDeductibilityAsync(userId.Value);

        return await GetZakatConfigAsync(userId);
    }

    public async Task<ZakatConfig> AddZakatConfigAsync(int userId, ZakatConfigRequest configRequest)
    {
        var zakatConfig = await context.ZakatConfigs
            .FirstOrDefaultAsync(z => z.UserId == userId);

        if (zakatConfig == null)
        {
            zakatConfig = new ZakatConfig
            {
                UserId = userId,
                ReminderEnabled = configRequest.ReminderEnabled,
                Email = configRequest.Email,
                GeminiApiKey = configRequest.GeminiApiKey,
                BaseCurrency = configRequest.BaseCurrency ?? "EGP"
            };

            // Set dates
            if (configRequest.ZakatDate != default)
            {
                zakatConfig.ZakatDate = configRequest.ZakatDate;
                zakatConfig.ZakatAnniversaryDay = _hijriCalendar.GetDayOfMonth(zakatConfig.ZakatDate);
                zakatConfig.ZakatAnniversaryMonth = _hijriCalendar.GetMonth(zakatConfig.ZakatDate);
            }
            else if (configRequest.ZakatAnniversaryDay != null && configRequest.ZakatAnniversaryMonth != null)
            {
                zakatConfig.ZakatAnniversaryDay = configRequest.ZakatAnniversaryDay;
                zakatConfig.ZakatAnniversaryMonth = configRequest.ZakatAnniversaryMonth;
                int currentHijriYear = _hijriCalendar.GetYear(DateTime.UtcNow);
                zakatConfig.ZakatDate = GetNextHijriOccurrence(currentHijriYear, zakatConfig.ZakatAnniversaryMonth.Value, zakatConfig.ZakatAnniversaryDay.Value);
            }
            else
            {
                zakatConfig.ZakatDate = DateTime.UtcNow;
                zakatConfig.ZakatAnniversaryDay = _hijriCalendar.GetDayOfMonth(zakatConfig.ZakatDate);
                zakatConfig.ZakatAnniversaryMonth = _hijriCalendar.GetMonth(zakatConfig.ZakatDate);
            }

            await context.ZakatConfigs.AddAsync(zakatConfig);
        }
        else
        {
            // Reuse update logic for existing config
            return await UpdateZakatConfigAsync(userId, configRequest);
        }

        await context.SaveChangesAsync();
        await cycleService.RecalculateUserCyclesAsync(userId);
        await liabilityService.RecalculateDeductibilityAsync(userId);
        return await GetZakatConfigAsync(userId);
    }

    private DateTime GetNextHijriOccurrence(int hijriYear, int hijriMonth, int hijriDay)
    {
        int daysInMonth = _hijriCalendar.GetDaysInMonth(hijriYear, hijriMonth);
        int finalDay = Math.Min(hijriDay, daysInMonth);
        DateTime gDate = _hijriCalendar.ToDateTime(hijriYear, hijriMonth, finalDay, 0, 0, 0, 0);

        if (gDate < DateTime.UtcNow.AddDays(-30))
        {
            hijriYear++;
            daysInMonth = _hijriCalendar.GetDaysInMonth(hijriYear, hijriMonth);
            finalDay = Math.Min(hijriDay, daysInMonth);
            gDate = _hijriCalendar.ToDateTime(hijriYear, hijriMonth, finalDay, 0, 0, 0, 0);
        }
        return gDate;
    }
}
