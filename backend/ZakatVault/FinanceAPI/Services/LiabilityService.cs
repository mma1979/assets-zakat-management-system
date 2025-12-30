using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;


public interface ILiabilityService
{
    Task<IEnumerable<Liability>> GetUserLiabilitiesAsync(int userId);
    Task<Liability?> CreateLiabilityAsync(int userId, CreateLiabilityDto dto);
    Task<bool> DeleteLiabilityAsync(int userId, int liabilityId);
    Task<Liability?> DecreaseLiabilityAmountAsync(int userId, int liabilityId, decimal decreaseAmount);
    Task RecalculateDeductibilityAsync(int userId);
}

public class LiabilityService : ILiabilityService
{
    private readonly FinanceDbContext _context;

    public LiabilityService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Liability>> GetUserLiabilitiesAsync(int userId)
    {
        return await _context.Liabilities
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.DueDate)
            .ToListAsync();
    }

    public async Task<Liability?> CreateLiabilityAsync(int userId, CreateLiabilityDto dto)
    {
        var liability = new Liability
        {
            UserId = userId,
            Title = dto.Title,
            Amount = dto.Amount,
            DueDate = dto.DueDate,
            IsDeductible = dto.IsDeductible
        };

        _context.Liabilities.Add(liability);
        await _context.SaveChangesAsync();
        return liability;
    }

    public async Task<bool> DeleteLiabilityAsync(int userId, int liabilityId)
    {
        var liability = await _context.Liabilities
            .FirstOrDefaultAsync(l => l.Id == liabilityId && l.UserId == userId);

        if (liability == null) return false;

        _context.Liabilities.Remove(liability);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task RecalculateDeductibilityAsync(int userId)
    {
        var config = await _context.ZakatConfigs.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return;

        // Determine the window [StartDate, EndDate]
        // Same logic as ZakatCycleService/VW_ZakatCalc
        var lastCycle = await _context.ZakatCycles.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.GregorianDate)
            .FirstOrDefaultAsync();

        DateTime endDate = lastCycle?.GregorianDate ?? config.ZakatDate;
        DateTime startDate = endDate.AddDays(-355);

        var liabilities = await _context.Liabilities.Where(l => l.UserId == userId).ToListAsync();
        foreach (var l in liabilities)
        {
            if (l.DueDate == null)
            {
                l.IsDeductible = true;
            }
            else
            {
                // Simple date comparison
                l.IsDeductible = l.DueDate >= startDate && l.DueDate <= endDate;
            }
        }

        await _context.SaveChangesAsync();
    }
    
    public async Task<Liability?> DecreaseLiabilityAmountAsync(int userId, int liabilityId, decimal decreaseAmount)
    {
        var liability = await _context.Liabilities
            .FirstOrDefaultAsync(l => l.Id == liabilityId && l.UserId == userId);
            
        if (liability == null) return null;
        
        liability.Amount -= decreaseAmount;
        
        if (liability.Amount <= 0)
        {
            _context.Liabilities.Remove(liability);
        }
        
        await _context.SaveChangesAsync();
        return liability.Amount <= 0 ? null : liability;
    }
}