using FinanceAPI.Components;
using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Hangfire;

using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface INotificationService
{

    void SendZakatReminder();

    void SendPriceAlert();
}

public class NotificationService(FinanceDbContext context, RazorComponentCompiler compiler, ResendService resendService) : INotificationService
{


    public void SendZakatReminder()
    {
        var users = context.Users
            .AsNoTracking()
             .Select(u => u.Id)
             .ToList();

        foreach (var userId in users)
        {
            BackgroundJob.Enqueue(QueuesNames.NOTIFICATIONS, () => SendReminder(userId));
        }
    }

    public async Task SendReminder(int userId)
    {
        var user = await context.Users.FindAsync(userId);
        if (user == null)
        {
            //throw new InvalidOperationException("User not found.");
            return;
        }
        var zakatCalc = await context.VwZakatCalc
            .FirstOrDefaultAsync(z => z.UserId == userId);

        if (zakatCalc == null)
        {
            //throw new InvalidOperationException("Zakat calculation data not found for user.");
            return;
        }
        var model = new ZakatReminderEmailModel
        {
            UserName = user.Name,
            ZakatDueDate = zakatCalc.LunarEndDate,
            TotalZakatDue = zakatCalc.TotalZakatDue.ToString("C"),
            TotalAssets = zakatCalc.TotalAssets.ToString("C")
        };
        var html = await compiler.Compile<ZakatReminderEmail>(new Dictionary<string, object?> { { "Model", model } });

        await resendService.Send(user.Email, "Zakat Reminder", html);

    }

    public void SendPriceAlert()
    {
        var rates = from r in context.Rates
                    join pa in context.PriceAlerts on r.Name equals pa.AssetType
                    join u in context.Users on pa.UserId equals u.Id
                    where r.Value >= pa.TargetPrice && pa.Condition == "Above" && pa.IsActive
                       || r.Value <= pa.TargetPrice && pa.Condition == "Below" && pa.IsActive
                    select new
                    {
                        r.Value,
                        pa.AssetType,
                        pa.TargetPrice,
                        pa.Condition,
                        u.Email,
                        u.Name
                    };

        foreach (var alert in rates)
        {
                        BackgroundJob.Enqueue(QueuesNames.NOTIFICATIONS, () => SendAlert(alert.Name, alert.Email, alert.AssetType, alert.Value, alert.TargetPrice, alert.Condition));

        }
    }

    public async Task SendAlert(string userName, string email,string assetType, decimal value, decimal targetPrice, string condition)
    {
        
        var model = new PriceAlertEmailModel { 
            AssetType = assetType,
            CurrentPrice = value.ToString("C"),
            TargetPrice = targetPrice.ToString("C"),
            Condition = condition,
            UserName = userName
        };
        var html = await compiler.Compile<PriceAlertEmail>(new Dictionary<string, object?> { { "Model", model } });

        await resendService.Send(email, "Price Alert", html);

    }
}
