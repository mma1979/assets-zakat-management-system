using System;

namespace ZakatVault.Models;

public class ZakatConfigRequest
{
    public DateTime ZakatDate { get; set; } = DateTime.UtcNow;
    public bool ReminderEnabled { get; set; }
    public string? Email { get; set; } = string.Empty;
    public string? GeminiApiKey { get; set; } = string.Empty;
}

public class NisabInfo
{
    public decimal ThresholdGrams { get; set; }
    public decimal PricePerGram { get; set; }
    public decimal ThresholdValue { get; set; }
}

public class ZakatCalculationResult
{
    public DateTime DueDate { get; set; }
    public string HijriDueDate { get; set; } = string.Empty;
    public int DaysRemaining { get; set; }
    public decimal TotalZakatDue { get; set; }
    public decimal TotalAssets { get; set; }
    public decimal DeductibleLiabilities { get; set; }
    public decimal NetZakatBase { get; set; }
    public NisabInfo GoldNisab { get; set; } = new();
    public NisabInfo SilverNisab { get; set; } = new();
    public bool IsNisabMet { get; set; }
}
