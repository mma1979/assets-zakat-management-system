using FinanceAPI.Consts;
using FinanceAPI.Models;
using FinanceAPI.Services;
using Hangfire;

namespace FinanceAPI.Jobs;

public class ZakatJobsService : BaseJobService
{
    public override void RegisterJobs(List<JobConfig> jobConfigs)
    {
        // We'll use a standard key or check it from appsettings
        string jobId = "process-zakat-cycles";
        var jobConfig = jobConfigs.FirstOrDefault(jc => jc.JobId == jobId);
        
        // Even if not in config explicitly, we might want it enabled by default or just use a default cron
        string cron = jobConfig?.CronExpression ?? Cron.Daily();

        if (jobConfig == null || jobConfig.Enabled)
        {
            RecurringJob.AddOrUpdate<IZakatCycleService>(jobId,
                x => x.ProcessPendingCyclesAsync(),
                cron,
                new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Local
                });
        }
    }
}
