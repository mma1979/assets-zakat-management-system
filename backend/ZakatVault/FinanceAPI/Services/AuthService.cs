using FinanceAPI.Data;
using FinanceAPI.Models;

using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FinanceAPI.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> Verify2FaAsync(Verify2FaDto dto);
    Task<TwoFactorSetupDto> Setup2FaAsync(int userId);
    Task<bool> Enable2FaAsync(int userId, TwoFactorVerifySetupDto dto);
    Task<bool> Disable2FaAsync(int userId);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto);
}

public class AuthService : IAuthService
{
    private readonly FinanceDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(FinanceDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(user),
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsTwoFactorEnabled = user.IsTwoFactorEnabled
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            return null;

        if (user.IsTwoFactorEnabled)
        {
            return new AuthResponseDto
            {
                TwoFactorRequired = true,
                ChallengeToken = GenerateChallengeToken(user),
                Email = user.Email,
                IsTwoFactorEnabled = user.IsTwoFactorEnabled
            };
        }

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(user),
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsTwoFactorEnabled = user.IsTwoFactorEnabled
        };
    }

    public async Task<AuthResponseDto?> Verify2FaAsync(Verify2FaDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !user.IsTwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
            return null;

        if (!ValidateChallengeToken(dto.ChallengeToken, user.Id.ToString()))
            return null;

        var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(user.TwoFactorSecret));
        if (!totp.VerifyTotp(dto.Code, out _))
            return null;

        return new AuthResponseDto
        {
            Token = GenerateJwtToken(user),
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsTwoFactorEnabled = user.IsTwoFactorEnabled
        };
    }

    public async Task<TwoFactorSetupDto> Setup2FaAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException();

        var secret = OtpNet.KeyGeneration.GenerateRandomKey(20);
        var base32Secret = OtpNet.Base32Encoding.ToString(secret);
        
        // otpauth://totp/Issuer:Label?secret=Secret&issuer=Issuer
        var qrCodeUri = $"otpauth://totp/ZakatVault:{user.Email}?secret={base32Secret}&issuer=ZakatVault";

        return new TwoFactorSetupDto
        {
            Secret = base32Secret,
            QrCodeUri = qrCodeUri
        };
    }

    public async Task<bool> Enable2FaAsync(int userId, TwoFactorVerifySetupDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(dto.Secret));
        if (!totp.VerifyTotp(dto.Code, out _))
            return false;

        user.TwoFactorSecret = dto.Secret;
        user.IsTwoFactorEnabled = true;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> Disable2FaAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.IsTwoFactorEnabled = false;
        user.TwoFactorSecret = null;

        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateChallengeToken(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("purpose", "2fa_challenge")
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool ValidateChallengeToken(string token, string userId)
    {
        if (string.IsNullOrEmpty(token)) return false;

        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var tokenUserId = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier).Value;
            var purpose = jwtToken.Claims.First(x => x.Type == "purpose").Value;

            return tokenUserId == userId && purpose == "2fa_challenge";
        }
        catch
        {
            return false;
        }
    }

    private static string HashPassword(string password)
    {
        using var hmac = new HMACSHA512();
        var salt = hmac.Key;
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2) return false;

        var salt = Convert.FromBase64String(parts[0]);
        var hash = Convert.FromBase64String(parts[1]);

        using var hmac = new HMACSHA512(salt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return computedHash.SequenceEqual(hash);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;
        if (!VerifyPassword(dto.CurrentPassword, user.PasswordHash)) return false;
        if (dto.NewPassword != dto.ConfirmPassword) return false;
        user.PasswordHash = HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        return true;
    }
}