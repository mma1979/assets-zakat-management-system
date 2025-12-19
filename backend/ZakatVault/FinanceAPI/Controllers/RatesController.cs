using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RatesController(IRatesService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var rates = await service.GetLatestRatesAsync();
        return Ok(rates);
    }

    [HttpPost]
    public async Task<IActionResult> AddRate([FromBody]RateItem rate)
    {
        var newRates = await service.AddRateAsync(rate);
        return Ok(newRates);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateRates(RatesRequest rates)
    {
        var newRates = await service.UpdateRatesAsync(rates);
        return Ok(newRates);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRate([FromRoute] int id)
    {
        return Ok();
    }
}
