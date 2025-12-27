using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        if (result == null)
            return BadRequest(new { message = "Email already exists" });

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Invalid credentials" });

        return Ok(result);
    }

    [HttpPost("verify-2fa")]
    public async Task<IActionResult> Verify2Fa([FromBody] Verify2FaDto dto)
    {
        var result = await _authService.Verify2FaAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Invalid 2FA code" });

        return Ok(result);
    }

    [HttpGet("setup-2fa")]
    [Authorize]
    public async Task<IActionResult> Setup2Fa()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _authService.Setup2FaAsync(userId);
        return Ok(result);
    }

    [HttpPost("enable-2fa")]
    [Authorize]
    public async Task<IActionResult> Enable2Fa([FromBody] TwoFactorVerifySetupDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _authService.Enable2FaAsync(userId, dto);
        if (!result)
            return BadRequest(new { message = "Invalid 2FA code or setup failed" });

        return Ok(new { message = "2FA enabled successfully" });
    }

    [HttpPost("disable-2fa")]
    [Authorize]
    public async Task<IActionResult> Disable2Fa()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _authService.Disable2FaAsync(userId);
        if (!result)
            return BadRequest(new { message = "Failed to disable 2FA" });

        return Ok(new { message = "2FA disabled successfully" });
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _authService.ChangePasswordAsync(userId,dto);
        if (!result)
            return BadRequest(new { message = "Password change failed" });
        return Ok(new { message = "Password change success" });
    }
}
