using FinanceAPI.Consts;
using FinanceAPI.Models;
using FinanceAPI.Services;

using Hangfire;

using System.Linq;

namespace FinanceAPI.Jobs;

public class NotificationsJobsService : BaseJobService
{
    public override void RegisterJobs(List<JobConfig> jobConfigs)
    {
        List<string> jobs = [JobsNames.SEND_ZAKAT_DUE_DATE_REMINDER, JobsNames.PRICE_ALERTS];

        var job1 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[0]);
        if (job1?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<INotificationService>(job1.JobId,
               x => x.SendZakatReminder(),
               job1.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }

        var job2 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[1]);
        if (job2?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<INotificationService>(job2.JobId,
               x => x.SendPriceAlert(),
               job2.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }
    }
}
