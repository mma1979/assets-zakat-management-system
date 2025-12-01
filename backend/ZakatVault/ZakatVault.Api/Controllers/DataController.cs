using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ZakatVault.Api.Models;
using ZakatVault.Api.Services;


namespace ZakatVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DataController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<DataController> _logger;

    public DataController(IDataService dataService, ILogger<DataController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's stored financial data
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(StoreData), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetData()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var data = await _dataService.GetUserDataAsync(userId);

        if (data == null)
        {
            _logger.LogInformation("No data found for user: {UserId}", userId);
            return Ok(new
            {
                transactions = new dynamic[] { },
                liabilities = new dynamic[] { },
                rates = new
                {
                    gold_egp = 3500,
                    gold21_egp = 3000,
                    silver_egp = 40,
                    usd_egp = 48,
                    lastUpdated = DateTime.Now.ToString("yyyy-MM-dd"),
                    dataSources = new dynamic[] { },
                },
                zakatConfig =
            new
            {
                zakatDate = DateTime.Now.ToString("yyyy-MM-dd"),
                reminderEnabled = false,
                email = "mamado2000@gmail.com"
            }
            });
        }

        _logger.LogInformation("Data retrieved successfully for user: {UserId}", userId);
        return Ok(data);
    }

    /// <summary>
    /// Save/update user's financial data
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SaveData([FromBody] StoreData data)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (data == null)
        {
            return BadRequest(new ErrorResponse { Message = "Invalid data" });
        }

        var success = await _dataService.SaveUserDataAsync(userId, data);

        if (!success)
        {
            _logger.LogError("Failed to save data for user: {UserId}", userId);
            return BadRequest(new ErrorResponse { Message = "Failed to save data" });
        }

        _logger.LogInformation("Data saved successfully for user: {UserId}", userId);
        return Ok(new SuccessResponse { Success = true });
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
               User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
    }
}