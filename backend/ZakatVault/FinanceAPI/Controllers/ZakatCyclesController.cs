using FinanceAPI.Models;
using FinanceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ZakatCyclesController(IZakatCycleService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ZakatCycle>>> Get()
    {
        var userIdValue = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdValue == null) return Unauthorized();
        
        var userId = int.Parse(userIdValue);
        var cycles = await service.GetUserCyclesAsync(userId);
        return Ok(cycles);
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ZakatCycle>> Generate()
    {
        var userIdValue = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdValue == null) return Unauthorized();

        var userId = int.Parse(userIdValue);
        var cycle = await service.CreateNextCycleAsync(userId);
        if (cycle == null) return BadRequest("Could not generate cycle. Ensure anniversary settings are configured.");
        
        return Ok(cycle);
    }
}
