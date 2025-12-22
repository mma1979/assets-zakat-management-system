using FinanceAPI.Services;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DashboardController(IDashboardService service) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetDashboardSummaryAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var summary = await service.GetDashboardSummaryAsync(userId);
        return Ok(summary);
    }

    [HttpGet("portfolio-composition")]
    public async Task<IActionResult> GetPortfolioCompositionAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var data = await service.GetPortfolioCompositionAsync(userId);
        return Ok(data);
    }
}
