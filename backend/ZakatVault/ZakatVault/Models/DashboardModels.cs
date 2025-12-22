namespace ZakatVault.Models;

public class DashboardSummary
{
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal NetWorth { get; set; }
}

public class RateResponse
{
    public int id { get; set; }
    public string key { get; set; } = string.Empty;
    public decimal value { get; set; }
    public DateTime lastUpdated { get; set; }
    public string icon { get; set; } = string.Empty;
    public string title { get; set; } = string.Empty;
    public int order { get; set; }
}

public class MarketRate
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public class PortfolioMetric
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class PortfolioHistoryDataPoint
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
}

public class PortfolioHistorySeries
{
    public string Title { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public List<PortfolioHistoryDataPoint> History { get; set; } = new();
}