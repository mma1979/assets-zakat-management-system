namespace FinanceAPI.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? TwoFactorSecret { get; set; }
    public bool IsTwoFactorEnabled { get; set; }
    public List<TrustedDevice> TrustedDevices { get; set; } = new();
}
public class TrustedDevice
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public virtual User? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string? PinHash { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
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
    public DateTime ZakatDate { get; set; } = DateTime.UtcNow;
    public bool ReminderEnabled { get; set; }
    public string? Email { get; set; } = string.Empty;
    public string? GeminiApiKey { get; set; } = string.Empty;
    public string BaseCurrency { get; set; } = "EGP";
    public User? User { get; set; }
}

public class ZakatConfigRequest
{
    public DateTime ZakatDate { get; set; } = DateTime.UtcNow;
    public bool ReminderEnabled { get; set; }
    public string? Email { get; set; } = string.Empty;
    public string? GeminiApiKey { get; set; } = string.Empty;
    public string? BaseCurrency { get; set; }
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
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty; // "Gold", "Silver", "USD_EGP"
    public string Icon { get; set; } = string.Empty; 
    public string Title { get; set; } = string.Empty; 
    public decimal Value { get; set; }
    public int Order { get; set; } = 1;
    public DateTime LastUpdated { get; set; }
    public User? User { get; set; }
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
    public string? Password { get; set; }
    public string? Pin { get; set; }
    public string? TrustToken { get; set; }
}

public class LoginPinDto
{
    public string Email { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
    public string TrustToken { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public int UserId { get; set; }
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool TwoFactorRequired { get; set; }
    public string? ChallengeToken { get; set; }
    public bool IsTwoFactorEnabled { get; set; }
    public string? TrustToken { get; set; }
}

public class Verify2FaDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string ChallengeToken { get; set; } = string.Empty;
    public bool RememberDevice { get; set; }
    public string? Pin { get; set; }
}

public class TwoFactorSetupDto
{
    public string Secret { get; set; } = string.Empty;
    public string QrCodeUri { get; set; } = string.Empty;
}

public class TwoFactorVerifySetupDto
{
    public string Code { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
}

public class CreatePriceAlertDto
{
    public string AssetType { get; set; } = string.Empty;
    public decimal TargetPrice { get; set; }
    public string Condition { get; set; } = string.Empty;
}

public class CreateTransactionDto
{
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

public class ZakatPayment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}

public class CreateZakatPaymentDto
{
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}