using System;

namespace ZakatVault.Models;

public class ZakatConfigRequest
{
    public DateTime ZakatDate { get; set; } = DateTime.UtcNow;
    public bool ReminderEnabled { get; set; }
    public string? Email { get; set; } = string.Empty;
    public string? GeminiApiKey { get; set; } = string.Empty;
}
