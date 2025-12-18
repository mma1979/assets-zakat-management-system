namespace FinanceAPI.Models;

public class ZakatReminderEmailModel
{
    public string ZakatDueDate { get; set; } = string.Empty;
    public string TotalZakatDue { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string TotalAssets { get; set; } = string.Empty;
}
