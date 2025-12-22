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
    public decimal Percentage { get; set; }
    public string Color { get; set; } = string.Empty;
}


public class PortfolioValue
{
    public string? Date { get; set; }
    public decimal Value { get; set; }
}

public class PortfolioValueGroup
{
    public string? Title { get; set; }
    public string Color { get; set; } = string.Empty;
    public List<PortfolioValue> History { get; set; } = [];
}