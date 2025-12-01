using System.ComponentModel.DataAnnotations;

namespace ZakatVault.Api.Models;

// ==================== DATABASE ENTITIES ====================

/// <summary>
/// User entity representing a registered user in the system
/// </summary>
public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// UserData entity storing the user's financial data as JSON
/// </summary>
public class UserData
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string JsonData { get; set; } = string.Empty;

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User? User { get; set; }
}
