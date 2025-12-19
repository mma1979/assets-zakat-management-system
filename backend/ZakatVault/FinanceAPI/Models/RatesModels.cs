namespace FinanceAPI.Models;



public class ViewRatesModel
{
    public decimal gold_egp { get; set; }
    public decimal gold21_egp { get; set; }
    public decimal silver_egp { get; set; }
    public decimal usd_egp { get; set; }
    public decimal egp { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class RatesRequest
{
    public decimal gold_egp { get; set; } = 0m;
    public decimal gold21_egp { get; set; } = 0m;
    public decimal silver_egp { get; set; } = 0m;
    public decimal usd_egp { get; set; } = 0m;
    public decimal egp { get; set; } = 1m;

}

public class RatesResponse
{
    public decimal gold_egp { get; set; } = 0m;
    public decimal gold21_egp { get; set; } = 0m;
    public decimal silver_egp { get; set; } = 0m;
    public decimal usd_egp { get; set; } = 0m;
    public decimal egp { get; set; } = 1m;
    public DateTime lastUpdated { get; set; } = DateTime.UtcNow;
    public object[] dataSources { get; set; } = [];
}


public class RateItem
{
    public string key { get; set; } = string.Empty;
    public decimal value { get; set; } = 0m;
    public string icon { get; set; } = string.Empty;
    public string title { get; set; } = string.Empty;
}

