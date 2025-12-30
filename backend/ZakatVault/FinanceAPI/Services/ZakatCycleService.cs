using FinanceAPI.Data;
using FinanceAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FinanceAPI.Services;

public interface IZakatCycleService
{
    Task ProcessPendingCyclesAsync();
    Task<ZakatCycle?> CreateNextCycleAsync(int userId);
    Task<List<ZakatCycle>> GetUserCyclesAsync(int userId);
}

public class ZakatCycleService(FinanceDbContext context, ILogger<ZakatCycleService> logger, INotificationService notificationService) : IZakatCycleService
{
    private readonly UmAlQuraCalendar _hijriCalendar = new UmAlQuraCalendar();

    public async Task ProcessPendingCyclesAsync()
    {
        var usersWithConfig = await context.ZakatConfigs
            .Where(c => c.ZakatAnniversaryDay != null && c.ZakatAnniversaryMonth != null)
            .ToListAsync();

        foreach (var config in usersWithConfig)
        {
            try
            {
                await CreateNextCycleIfNeededAsync(config);
                await CheckAndNotifyDueCyclesAsync(config.UserId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing Zakat cycle for user {UserId}", config.UserId);
            }
        }
    }

    private async Task CheckAndNotifyDueCyclesAsync(int userId)
    {
        var now = DateTime.UtcNow.Date;
        var dueCycle = await context.ZakatCycles
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status != "Paid" && c.GregorianDate.Date <= now);

        if (dueCycle != null)
        {
            // If it was Open, mark as Due? Or just notify.
            // ZakatCalculator logic might handle status.
            await notificationService.SendPushNotificationAsync(userId, "Zakat Due", $"Your Zakat for {dueCycle.HijriYear} AH is now due.");
        }
    }

    private async Task CreateNextCycleIfNeededAsync(ZakatConfig config)
    {
        // 1. Calculate the current/upcoming Gregorian date for the anniversary
        var now = DateTime.UtcNow;
        var currentHijriYear = _hijriCalendar.GetYear(now);
        
        DateTime anniversaryThisYear = GetGregorianDate(currentHijriYear, config.ZakatAnniversaryMonth!.Value, config.ZakatAnniversaryDay!.Value);
        
        // If this year's anniversary has passed, look at next year
        DateTime targetDate = anniversaryThisYear;
        int targetHijriYear = currentHijriYear;

        if (anniversaryThisYear < now.AddDays(-30)) // Give 30 days buffer or similar? Or just if passed.
        {
            targetHijriYear++;
            targetDate = GetGregorianDate(targetHijriYear, config.ZakatAnniversaryMonth!.Value, config.ZakatAnniversaryDay!.Value);
        }

        // 2. Check if cycle already exists for this Hijri year
        string hijriYearStr = targetHijriYear.ToString();
        var exists = await context.ZakatCycles
            .AnyAsync(c => c.UserId == config.UserId && c.HijriYear == hijriYearStr);

        if (!exists)
        {
            var newCycle = new ZakatCycle
            {
                UserId = config.UserId,
                HijriYear = hijriYearStr,
                GregorianDate = targetDate,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            context.ZakatCycles.Add(newCycle);
            await context.SaveChangesAsync();
            logger.LogInformation("Created new Zakat cycle {HijriYear} for user {UserId}", hijriYearStr, config.UserId);
        }
    }

    public async Task<ZakatCycle?> CreateNextCycleAsync(int userId)
    {
        var config = await context.ZakatConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null || config.ZakatAnniversaryDay == null || config.ZakatAnniversaryMonth == null) return null;

        await CreateNextCycleIfNeededAsync(config);
        return await context.ZakatCycles
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.HijriYear)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ZakatCycle>> GetUserCyclesAsync(int userId)
    {
        return await context.ZakatCycles
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.GregorianDate)
            .ToListAsync();
    }

    private DateTime GetGregorianDate(int hijriYear, int hijriMonth, int hijriDay)
    {
        // Handle month/day edge cases if necessary (e.g. 30th day in a 29-day month)
        int daysInMonth = _hijriCalendar.GetDaysInMonth(hijriYear, hijriMonth);
        int finalDay = Math.Min(hijriDay, daysInMonth);

        return _hijriCalendar.ToDateTime(hijriYear, hijriMonth, finalDay, 0, 0, 0, 0);
    }
}
