using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[Route("api/[controller]")]
[Route("api/zakat-payments")]
[ApiController]
[Authorize]
public class ZakatPaymentsController(IZakatPaymentService service) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ZakatPayment>>> GetPayments()
    {
        var userId = GetUserId();
        var payments = await service.GetUserPaymentsAsync(userId);
        return Ok(payments);
    }

    [HttpPost]
    public async Task<ActionResult<ZakatPayment>> AddPayment(CreateZakatPaymentDto dto)
    {
        var userId = GetUserId();
        var payment = await service.AddPaymentAsync(userId, dto);
        return CreatedAtAction(nameof(GetPayments), new { id = payment.Id }, payment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePayment(int id)
    {
        var userId = GetUserId();
        var result = await service.DeletePaymentAsync(id, userId);
        if (!result) return NotFound();
        return NoContent();
    }
}
