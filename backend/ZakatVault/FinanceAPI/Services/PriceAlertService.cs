using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IPriceAlertService
{
    Task<IEnumerable<PriceAlert>> GetUserAlertsAsync(int userId);
    Task<PriceAlert?> CreateAlertAsync(int userId, CreatePriceAlertDto dto);
    Task<bool> DeleteAlertAsync(int userId, int alertId);
    Task<bool> ToggleAlertAsync(int userId, int alertId);
}

public class PriceAlertService : IPriceAlertService
{
    private readonly FinanceDbContext _context;

    public PriceAlertService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PriceAlert>> GetUserAlertsAsync(int userId)
    {
        return await _context.PriceAlerts.AsNoTracking()
            .Where(pa => pa.UserId == userId)
            .OrderByDescending(pa => pa.Id)
            .ToListAsync();
    }

    public async Task<PriceAlert?> CreateAlertAsync(int userId, CreatePriceAlertDto dto)
    {
        var alert = new PriceAlert
        {
            UserId = userId,
            AssetType = dto.AssetType,
            TargetPrice = dto.TargetPrice,
            Condition = dto.Condition,
            IsActive = true
        };

        _context.PriceAlerts.Add(alert);
        await _context.SaveChangesAsync();
        return alert;
    }

    public async Task<bool> DeleteAlertAsync(int userId, int alertId)
    {
        var alert = await _context.PriceAlerts
            .FirstOrDefaultAsync(pa => pa.Id == alertId && pa.UserId == userId);

        if (alert == null) return false;

        _context.PriceAlerts.Remove(alert);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleAlertAsync(int userId, int alertId)
    {
        var alert = await _context.PriceAlerts
            .FirstOrDefaultAsync(pa => pa.Id == alertId && pa.UserId == userId);

        if (alert == null) return false;

        alert.IsActive = !alert.IsActive;
        await _context.SaveChangesAsync();
        return true;
    }
}