using FinanceAPI.Components;
using FinanceAPI.Consts;
using FinanceAPI.Data;
using FinanceAPI.Models;

using Hangfire;

using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Services;

public interface INotificationService
{

    void SendZakatReminder();

    void SendPriceAlert();

    Task SendPushNotificationAsync(int userId, string title, string body, string? url = null);
    Task SendPushToSubscriptionAsync(FinanceAPI.Models.PushSubscription sub, string title, string body, string? url = null);
}

public class NotificationService(
    FinanceDbContext context, 
    RazorComponentCompiler compiler, 
    ResendService resendService, 
    IZakatCalcService zakatCalcService,
    IVapidKeyService vapidKeyService) : INotificationService
{
    private readonly PushServiceClient _pushClient = new();


    public void SendZakatReminder()
    {
        var users = context.Users
            .LeftJoin( context.ZakatConfigs,
                u => u.Id,
                z => z.UserId,
                (u, z) => new { User = u, Config = z })
            .Where(u => u.Config == null || EF.Functions.DateDiffDay(u.Config.ZakatDate, DateTime.UtcNow) == 2)
             .Select(u => new {u.User.Id, ZakatDate = u.Config == null? DateTime.UtcNow: u.Config.ZakatDate })
             .ToList();

        foreach (var user in users)
        {
            BackgroundJob.Enqueue(QueuesNames.NOTIFICATIONS, () => SendReminder(user.Id));
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
        var zakatCalc = await zakatCalcService.GetZakatCalcAsync(userId);

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

    public async Task SendPushNotificationAsync(int userId, string title, string body, string? url = null)
    {
        var subscriptions = await context.PushSubscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        foreach (var sub in subscriptions)
        {
            await SendPushToSubscriptionAsync(sub, title, body, url);
        }
    }

    public async Task SendPushToSubscriptionAsync(FinanceAPI.Models.PushSubscription sub, string title, string body, string? url = null)
    {
        try
        {
            var pushSubscription = new Lib.Net.Http.WebPush.PushSubscription
            {
                Endpoint = sub.Endpoint,
                Keys = new Dictionary<string, string>
                {
                    { "p256dh", sub.P256dh },
                    { "auth", sub.Auth }
                }
            };

            var payload = System.Text.Json.JsonSerializer.Serialize(new { title, body, url });
            var message = new PushMessage(payload)
            {
                Topic = "general"
            };

            var publicKey = vapidKeyService.GetPublicKey();
            var privateKey = vapidKeyService.GetPrivateKey();

            if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey))
            {
                // Push notifications won't work without keys
                return;
            }

            var vapidAuthentication = new VapidAuthentication(publicKey, privateKey)
            {
                Subject = "mailto:admin@zakatvault.com"
            };

            await _pushClient.RequestPushMessageDeliveryAsync(pushSubscription, message, vapidAuthentication);
        }
        catch (PushServiceClientException ex)
        {
            if (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                context.PushSubscriptions.Remove(sub);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception)
        {
            // Log other errors
        }
    }
}
