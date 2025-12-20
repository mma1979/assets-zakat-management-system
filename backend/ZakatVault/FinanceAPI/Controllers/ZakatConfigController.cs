using FinanceAPI.Models;
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

    [HttpPost]
    public async Task<IActionResult> AddZakatConfig([FromBody] ZakatConfigRequest configRequest)
    {
        var userIdValue = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId =  int.Parse(userIdValue!);
        var newConfig = await service.AddZakatConfigAsync(userId, configRequest);

        
        return Ok(newConfig);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateZakatConfig([FromBody] ZakatConfigRequest configRequest)
    {
        var userIdValue = HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = userIdValue is not null ? int.Parse(userIdValue) : (int?)null;
        var updatedConfig = await service.UpdateZakatConfigAsync(userId, configRequest);
       
        return Ok(updatedConfig);
    }
}   
