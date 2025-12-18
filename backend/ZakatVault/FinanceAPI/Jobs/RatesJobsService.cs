using FinanceAPI.Consts;
using FinanceAPI.Models;
using FinanceAPI.Services;

using Hangfire;

namespace FinanceAPI.Jobs;

public class RatesJobsService:BaseJobService
{
    public override void RegisterJobs(List<JobConfig> jobConfigs)
    {
        List<string> jobs = [JobsNames.UPDATE_EXCHANGE_RATES];
        var job1 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[0]);
        if (job1?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<IRatesService>(job1.JobId,
               x => x.UpdateRates(),
               job1.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }
    }
}
