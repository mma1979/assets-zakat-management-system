using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ZakatCalcController(IZakatCalcService service) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetZakatCalculation()
    {
        var userId = GetUserId();
        var zakatCalc = await service.GetZakatCalcAsync(userId);
        return Ok(zakatCalc);
    }
}
