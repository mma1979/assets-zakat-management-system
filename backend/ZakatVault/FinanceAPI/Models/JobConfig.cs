namespace FinanceAPI.Models;

public class JobConfig
{
    public string JobId { get; set; } = string.Empty;
    public string CronExpression { get; set; } = string.Empty;
    public bool Enabled { get; set; }
}
