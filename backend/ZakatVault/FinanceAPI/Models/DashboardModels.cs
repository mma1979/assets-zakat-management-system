namespace FinanceAPI.Models;

public class DashboardSummary
{
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal NetWorth { get; set; }
}

public class PortfolioMetric
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = string.Empty;
}