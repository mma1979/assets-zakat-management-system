namespace FinanceAPI.Models;



public class RateRequest
{
    public int id { get; set; }
    public decimal value { get; set; }
}

public class RateReorderRequest
{
    public int id { get; set; }
    public int order { get; set; }
}

public class RateResponse
{
    public int id { get; set; }
    public string key { get; set; }
    public decimal value { get; set; }
    public DateTime lastUpdated { get; set; }
    public string icon { get; set; }
    public string title { get; set; }
    public int order { get; set; }
}



public class RateItem
{
    public string key { get; set; } = string.Empty;
    public decimal value { get; set; } = 0m;
    public string icon { get; set; } = string.Empty;
    public string title { get; set; } = string.Empty;
}

