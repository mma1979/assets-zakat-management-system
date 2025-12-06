using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/price-alerts")]
[Authorize]
public class PriceAlertsController : ControllerBase
{
    private readonly IPriceAlertService _service;

    public PriceAlertsController(IPriceAlertService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAlerts()
    {
        var alerts = await _service.GetUserAlertsAsync(GetUserId());
        return Ok(alerts);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAlert([FromBody] CreatePriceAlertDto dto)
    {
        var alert = await _service.CreateAlertAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetAlerts), new { id = alert!.Id }, alert);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAlert(int id)
    {
        var result = await _service.DeleteAlertAsync(GetUserId(), id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleAlert(int id)
    {
        var result = await _service.ToggleAlertAsync(GetUserId(), id);
        if (!result) return NotFound();
        return NoContent();
    }
}