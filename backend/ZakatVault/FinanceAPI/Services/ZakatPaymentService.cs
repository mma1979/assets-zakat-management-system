using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface IZakatPaymentService
{
    Task<IEnumerable<ZakatPayment>> GetUserPaymentsAsync(int userId);
    Task<ZakatPayment> GetPaymentByIdAsync(int paymentId, int userId);
    Task<ZakatPayment> AddPaymentAsync(int userId, CreateZakatPaymentDto dto);
    Task<bool> DeletePaymentAsync(int paymentId, int userId);
}

public class ZakatPaymentService(FinanceDbContext context) : IZakatPaymentService
{
    public async Task<IEnumerable<ZakatPayment>> GetUserPaymentsAsync(int userId)
    {
        return await context.ZakatPayments
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.Date)
            .ToListAsync();
    }

    public async Task<ZakatPayment> GetPaymentByIdAsync(int paymentId, int userId)
    {
        return await context.ZakatPayments
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.UserId == userId);
    }

    public async Task<ZakatPayment> AddPaymentAsync(int userId, CreateZakatPaymentDto dto)
    {
        var payment = new ZakatPayment
        {
            UserId = userId,
            Amount = dto.Amount,
            Date = dto.Date,
            Notes = dto.Notes
        };

        context.ZakatPayments.Add(payment);
        await context.SaveChangesAsync();
        return payment;
    }

    public async Task<bool> DeletePaymentAsync(int paymentId, int userId)
    {
        var payment = await context.ZakatPayments
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.UserId == userId);

        if (payment == null) return false;

        context.ZakatPayments.Remove(payment);
        return await context.SaveChangesAsync() > 0;
    }
}
