using FinanceAPI.Models;

namespace FinanceAPI.Jobs;

public abstract class BaseJobService
{
    public virtual void RegisterJobs(List<JobConfig> jobConfigs) { }

}
