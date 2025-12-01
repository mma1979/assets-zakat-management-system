using System.Text.Json;

using ZakatVault.Api.Data;
using ZakatVault.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace ZakatVault.Api.Services;

public interface IDataService
{
    Task<StoreData?> GetUserDataAsync(string userId);
    Task<bool> SaveUserDataAsync(string userId, StoreData data);
}

public class DataService : IDataService
{
    private readonly AppDbContext _context;

    public DataService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StoreData?> GetUserDataAsync(string userId)
    {
        var userData = await _context.UserData
            .FirstOrDefaultAsync(ud => ud.UserId == userId);

        if (userData == null)
        {
            return null;
        }

        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var storeData = JsonSerializer.Deserialize<StoreData>(userData.JsonData, options);
            return storeData;
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> SaveUserDataAsync(string userId, StoreData data)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            var jsonData = JsonSerializer.Serialize(data, options);

            var existingData = await _context.UserData
                .FirstOrDefaultAsync(ud => ud.UserId == userId);

            if (existingData == null)
            {
                // Create new record
                var newData = new UserData
                {
                    UserId = userId,
                    JsonData = jsonData,
                    LastUpdated = DateTime.UtcNow
                };
                _context.UserData.Add(newData);
            }
            else
            {
                // Update existing record
                existingData.JsonData = jsonData;
                existingData.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }
}