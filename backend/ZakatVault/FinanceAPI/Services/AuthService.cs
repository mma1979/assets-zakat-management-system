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
    Task<AuthResponseDto?> LoginWithPinAsync(LoginPinDto dto);
    Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenDto dto);
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

        // Seed default rates for the new user
        var defaultRates = await _context.Rates
            .AsNoTracking()
            .Where(r => r.UserId == null)
            .ToListAsync();

        if (defaultRates.Any())
        {
            var userRates = defaultRates.Select(r => new Rate
            {
                UserId = user.Id,
                Name = r.Name,
                Icon = r.Icon,
                Title = r.Title,
                Value = r.Value,
                Order = r.Order,
                LastUpdated = DateTime.UtcNow
            }).ToList();
            _context.Rates.AddRange(userRates);
        }

        // Initialize ZakatConfig
        var config = new ZakatConfig
        {
            UserId = user.Id,
            ZakatDate = DateTime.UtcNow.AddYears(1),
            BaseCurrency = "EGP",
            Email = user.Email
        };
        _context.ZakatConfigs.Add(config);

        await _context.SaveChangesAsync();

        return await CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.TrustedDevices)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
            
        if (user == null || (dto.Password != null && !VerifyPassword(dto.Password, user.PasswordHash)))
            return null;

        // Check Trust Token if provided
        bool deviceTrusted = false;
        if (!string.IsNullOrEmpty(dto.TrustToken))
        {
            var trustedDevice = user.TrustedDevices.FirstOrDefault(td => td.ExpiresAt > DateTime.UtcNow && VerifyPassword(dto.TrustToken, td.TokenHash));
            if (trustedDevice != null)
            {
                deviceTrusted = true;
            }
        }

        if (user.IsTwoFactorEnabled && !deviceTrusted)
        {
            return new AuthResponseDto
            {
                TwoFactorRequired = true,
                ChallengeToken = GenerateChallengeToken(user),
                Email = user.Email,
                IsTwoFactorEnabled = user.IsTwoFactorEnabled
            };
        }

        var response = await CreateAuthResponse(user);
        if (response != null)
        {
            response.TrustToken = deviceTrusted ? dto.TrustToken : null;
        }
        return response;
    }

    public async Task<AuthResponseDto?> LoginWithPinAsync(LoginPinDto dto)
    {
        var user = await _context.Users
            .Include(u => u.TrustedDevices)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null) return null;

        var trustedDevice = user.TrustedDevices.FirstOrDefault(td => td.ExpiresAt > DateTime.UtcNow && VerifyPassword(dto.TrustToken, td.TokenHash));
        if (trustedDevice == null || string.IsNullOrEmpty(trustedDevice.PinHash) || !VerifyPassword(dto.Pin, trustedDevice.PinHash))
            return null;

        var response = await CreateAuthResponse(user);
        if (response != null)
        {
            response.TrustToken = dto.TrustToken;
        }
        return response;
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

        string? trustToken = null;
        if (dto.RememberDevice)
        {
            trustToken = Guid.NewGuid().ToString();
            var trustedDevice = new TrustedDevice
            {
                UserId = user.Id,
                TokenHash = HashPassword(trustToken),
                PinHash = !string.IsNullOrEmpty(dto.Pin) ? HashPassword(dto.Pin) : null,
                DeviceName = "Trusted Device",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };
            _context.TrustedDevices.Add(trustedDevice);
            await _context.SaveChangesAsync();
        }

        var response = await CreateAuthResponse(user);
        if (response != null)
        {
            response.TrustToken = trustToken;
        }
        return response;
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

    public async Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenDto dto)
    {
        var principal = GetPrincipalFromExpiredToken(dto.Token);
        if (principal == null) return null;

        var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return null;

        var user = await _context.Users.FindAsync(int.Parse(userIdStr));
        if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiry <= DateTime.UtcNow)
            return null;

        return await CreateAuthResponse(user);
    }

    private async Task<AuthResponseDto> CreateAuthResponse(User user)
    {
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsTwoFactorEnabled = user.IsTwoFactorEnabled
        };
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateLifetime = false 
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }
        catch
        {
            return null;
        }
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
            expires: DateTime.UtcNow.AddHours(1),
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