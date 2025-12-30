using FinanceAPI.Jobs;
using FinanceAPI.Models;

using Hangfire;
using Hangfire.Storage;

namespace FinanceAPI.Services;

public class HangfireService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    public HangfireService(IConfiguration configuration, IServiceProvider serviceProvider)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }
    public List<Type> JobsServiceTypes
    {
        get
        {
            var baseType = typeof(BaseJobService);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => a.FullName!.StartsWith("FinanceAPI", StringComparison.Ordinal));

            var types = assemblies.SelectMany(assembly => assembly.GetTypes())
                        .Where(type =>
                            !type.IsAbstract &&
                            baseType.IsAssignableFrom(type) &&
                            type.Namespace == "FinanceAPI.Jobs")
                        .ToList();

            return types;
        }
    }

    private void RemoveDisabledJobs()
    {
        var jobConfigs = _configuration.GetSection("Jobs").Get<List<JobConfig>>()!;
        var jobsToRemove = jobConfigs.Where(j => j.Enabled == false);
        foreach (var jobToRemove in jobsToRemove)
        {
            RecurringJob.RemoveIfExists(jobToRemove.JobId);
        }

        var recurringJobs = JobStorage.Current.GetConnection().GetRecurringJobs();
        foreach (var recurringJob in recurringJobs)
        {
            var jobConfig = jobConfigs.FirstOrDefault(j => j.JobId == recurringJob.Id);
            if (jobConfig == null)
            {
                RecurringJob.RemoveIfExists(recurringJob.Id);
            }
        }
    }

    public void EnqueueJobs()
    {
        var jobConfigs = _configuration.GetSection("Jobs").Get<List<JobConfig>>()!;
        foreach (var type in JobsServiceTypes)
        {
            try
            {
                var instance = (BaseJobService)ActivatorUtilities.CreateInstance(_serviceProvider, type);
                instance.RegisterJobs(jobConfigs);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error registering job {type.Name}: {ex.Message}");
            }
        }
        RemoveDisabledJobs();
    }
}