using FinanceAPI.Data;
using FinanceAPI.Models;
using FinanceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PushSubscriptionsController : ControllerBase
{
    private readonly FinanceDbContext _context;
    private readonly IVapidKeyService _vapidKeyService;

    public PushSubscriptionsController(FinanceDbContext context, IVapidKeyService vapidKeyService)
    {
        _context = context;
        _vapidKeyService = vapidKeyService;
    }

    [HttpGet("vapid-public-key")]
    public IActionResult GetVapidPublicKey()
    {
        return Ok(new { publicKey = _vapidKeyService.GetPublicKey() });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(PushSubscriptionDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var existing = await _context.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == dto.Endpoint);

        if (existing == null)
        {
            var sub = new FinanceAPI.Models.PushSubscription
            {
                UserId = userId,
                Endpoint = dto.Endpoint,
                P256dh = dto.P256dh,
                Auth = dto.Auth
            };
            _context.PushSubscriptions.Add(sub);
        }
        else
        {
            existing.P256dh = dto.P256dh;
            existing.Auth = dto.Auth;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("unregister")]
    public async Task<IActionResult> Unregister([FromBody] string endpoint)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sub = await _context.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (sub != null)
        {
            _context.PushSubscriptions.Remove(sub);
            await _context.SaveChangesAsync();
        }

        return Ok();
    }
}
