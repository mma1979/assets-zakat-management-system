using System.ComponentModel.DataAnnotations;

namespace ZakatVault.Api.Models;

// ==================== STORE DATA STRUCTURE ====================

/// <summary>
/// Main data structure storing all user financial information
/// This matches the frontend schema exactly
/// </summary>
public class StoreData
{
    public List<Transaction> Transactions { get; set; } = new();
    public List<Liability> Liabilities { get; set; } = new();
    public Rates Rates { get; set; } = new();
    public ZakatConfig ZakatConfig { get; set; } = new();
    public List<PriceAlert> PriceAlerts { get; set; } = new();
}

/// <summary>
/// Transaction record for buying or selling assets
/// </summary>
public class Transaction
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(BUY|SELL)$", ErrorMessage = "Type must be BUY or SELL")]
    public string Type { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(GOLD|GOLD_21|SILVER|USD|EGP)$", ErrorMessage = "Invalid asset type")]
    public string AssetType { get; set; } = string.Empty;

    [Range(0.000001, double.MaxValue, ErrorMessage = "Amount must be positive")]
    public decimal Amount { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Price per unit must be positive")]
    public decimal PricePerUnit { get; set; }

    [Required]
    public string Date { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Liability (debt or obligation) that can be deducted from Zakat calculation
/// </summary>
public class Liability
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be positive")]
    public decimal Amount { get; set; }

    [Required]
    public string DueDate { get; set; } = string.Empty;

    public bool IsDeductible { get; set; }
}

/// <summary>
/// Current exchange rates for various assets
/// </summary>
public class Rates
{
    [Range(0, double.MaxValue)]
    public decimal Gold_Egp { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Gold21_Egp { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Silver_Egp { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Usd_Egp { get; set; }

    public long LastUpdated { get; set; }

    public List<DataSource> DataSources { get; set; } = new();
}

/// <summary>
/// Source of pricing data
/// </summary>
public class DataSource
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Url]
    [StringLength(500)]
    public string Uri { get; set; } = string.Empty;
}

/// <summary>
/// Zakat configuration and reminder settings
/// </summary>
public class ZakatConfig
{
    [Required]
    public string ZakatDate { get; set; } = string.Empty;

    public bool ReminderEnabled { get; set; }

    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Price alert configuration for monitoring asset prices
/// </summary>
public class PriceAlert
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(GOLD|GOLD_21|SILVER|USD)$", ErrorMessage = "Invalid asset type")]
    public string AssetType { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Target price must be positive")]
    public decimal TargetPrice { get; set; }

    [Required]
    [RegularExpression("^(ABOVE|BELOW)$", ErrorMessage = "Condition must be ABOVE or BELOW")]
    public string Condition { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}