using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[Route("api/zakat-config")]
[ApiController]
[Authorize]
public class ZakatConfigController(IZakatConfigService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userIdValue = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = userIdValue is not null ? int.Parse(userIdValue) : (int?)null;
        var config = await service.GetZakatConfigAsync(userId);
        return Ok(config);
    }
}
