using FinanceAPI.Data;
using FinanceAPI.Models;
using FinanceAPI.Services;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FinanceAPI.Jobs;

public class LiabilityReminderJob(FinanceDbContext context, INotificationService notificationService) : BaseJobService
{
    public override void RegisterJobs(List<JobConfig> jobConfigs)
    {
        string jobId = "liability-reminders";
        var jobConfig = jobConfigs.FirstOrDefault(jc => jc.JobId == jobId);
        string cron = jobConfig?.CronExpression ?? Cron.Daily(10); // Default 10:00 AM

        if (jobConfig == null || jobConfig.Enabled)
        {
            RecurringJob.AddOrUpdate<LiabilityReminderJob>(jobId,
                x => x.ProcessRemindersAsync(),
                cron,
                new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });
        }
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task ProcessRemindersAsync()
    {
        var today = DateTime.UtcNow.Date;
        var threeDaysFromNow = today.AddDays(3);

        // Find liabilities due in the next 3 days
        var upcomingLiabilities = await context.Liabilities
            .Where(l => l.DueDate.HasValue && l.DueDate.Value.Date <= threeDaysFromNow && l.DueDate.Value.Date >= today)
            .ToListAsync();

        foreach (var liability in upcomingLiabilities )
        {
            var daysLeft = (liability.DueDate?.Date - today)?.Days ?? 0;
            string message = daysLeft == 0 
                ? $"Your liability '{liability.Title}' is due today!" 
                : $"Your liability '{liability.Title}' is due in {daysLeft} days.";

            await notificationService.SendPushNotificationAsync(liability.UserId, "Liability Reminder", message);
        }
    }
}
