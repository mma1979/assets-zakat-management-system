using FinanceAPI.Consts;
using FinanceAPI.Models;
using FinanceAPI.Services;

using Hangfire;

using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace FinanceAPI.Jobs;

public class DatabaseJobsService : BaseJobService
{
    public override void RegisterJobs(List<JobConfig> jobConfigs)
    {
        List<string> jobs = [
            JobsNames.BACKUP_DATABASE,
            JobsNames.GENERATE_MONTHLY_FINANCIAL_REPORTS,
            JobsNames.CLEAN_UP_OLD_TRANSACTIONS
            ];

        var job1 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[0]);
        if (job1?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<IDatabaseOperations>(job1.JobId,
               x => x.BackupDatabase(),
               job1.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }

        var job2 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[0]);
        if (job2?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<IDatabaseOperations>(job2.JobId,
               x => x.GenerateMonthlyFinancialReports(),
               job2.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }

        var job3 = jobConfigs.FirstOrDefault(jc => jc.JobId == jobs[0]);
        if (job3?.Enabled == true)
        {
            RecurringJob.AddOrUpdate<IDatabaseOperations>(job3.JobId,
               x => x.CleanUpOldTransactions(),
               job3.CronExpression,
               new RecurringJobOptions
               {
                   TimeZone = TimeZoneInfo.Local
               });
        }
    }
}
