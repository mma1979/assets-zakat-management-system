
using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface ITransactionService
{
    Task<IEnumerable<Transaction>> GetUserTransactionsAsync(int userId);
    Task<Transaction?> CreateTransactionAsync(int userId, CreateTransactionDto dto);
    Task<bool> DeleteTransactionAsync(int userId, int transactionId);
}

public class TransactionService : ITransactionService
{
    private readonly FinanceDbContext _context;

    public TransactionService(FinanceDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Transaction>> GetUserTransactionsAsync(int userId)
    {
        return await _context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .ToListAsync();
    }

    public async Task<Transaction?> CreateTransactionAsync(int userId, CreateTransactionDto dto)
    {
        DateTime dtoDateTime = dto.Date.ToDateTime(new TimeOnly(0, 0));
        var transaction = new Transaction
        {
            UserId = userId,
            Type = dto.Type,
            AssetType = dto.AssetType,
            Amount = dto.Amount,
            PricePerUnit = dto.PricePerUnit,
            Date = dtoDateTime,
            Notes = dto.Notes,
            IsNessabIncluded = (DateTime.UtcNow - dtoDateTime).TotalDays >= 355
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<bool> DeleteTransactionAsync(int userId, int transactionId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

        if (transaction == null) return false;

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return true;
    }
}