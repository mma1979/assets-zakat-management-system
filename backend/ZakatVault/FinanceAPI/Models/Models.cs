namespace FinanceAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PriceAlert
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public decimal TargetPrice { get; set; }
    public string Condition { get; set; } = string.Empty; // "Above" or "Below"
    public bool IsActive { get; set; }
    public User? User { get; set; }
}

public class ZakatConfig
{
    public int UserId { get; set; } = 1;
    public DateTime ZakatDate { get; set; } = new DateTime(2026, 7, 23);
    public bool ReminderEnabled { get; set; } = true;
    public string? Email { get; set; } = "mamado2000@gmail.com";
    public User? User { get; set; }
}

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty; // "Income", "Expense", "Investment"
    public string? AssetType { get; set; }
    public decimal Amount { get; set; }
    public decimal? PricePerUnit { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public bool IsNessabIncluded { get; set; }
    public User? User { get; set; }

   
}

public class Liability
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsDeductible { get; set; }
    public User? User { get; set; }
}

public class Rate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // "Gold", "Silver", "USD_EGP"
    public decimal Value { get; set; }
    public DateTime LastUpdated { get; set; }
}

// DTOs
public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class CreatePriceAlertDto
{
    public string AssetType { get; set; } = string.Empty;
    public decimal TargetPrice { get; set; }
    public string Condition { get; set; } = string.Empty;
}

public class CreateTransactionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? AssetType { get; set; }
    public decimal Amount { get; set; }
    public decimal? PricePerUnit { get; set; }
    public DateOnly Date { get; set; } // Changed from DateTime
    public string? Notes { get; set; }
}

public class CreateLiabilityDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsDeductible { get; set; }
}