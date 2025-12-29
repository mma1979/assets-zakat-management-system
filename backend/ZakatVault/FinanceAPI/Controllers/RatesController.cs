using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RatesController(IRatesService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var rates = await service.GetLatestRatesAsync(userId);
        return Ok(rates);
    }

    [HttpPost]
    public async Task<IActionResult> AddRate([FromBody]RateItem rate)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var newRates = await service.AddRateAsync(userId, rate);
        return Ok(newRates);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateRates(List<RateRequest> rates)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var newRates = await service.UpdateRatesAsync(userId, rates);
        return Ok(newRates);
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> ReorderRates(List<RateReorderRequest> rates)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var newRates = await service.ReorderRatesAsync(userId, rates);
        return Ok(newRates);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRate([FromRoute] int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var newRates = await service.DeleteRateAsync(userId, id);
        return Ok(newRates);
    }
}
