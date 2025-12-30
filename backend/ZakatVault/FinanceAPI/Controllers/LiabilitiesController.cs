
using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LiabilitiesController : ControllerBase
{
    private readonly ILiabilityService _service;

    public LiabilitiesController(ILiabilityService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetLiabilities()
    {
        var liabilities = await _service.GetUserLiabilitiesAsync(GetUserId());
        return Ok(liabilities);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLiability([FromBody] CreateLiabilityDto dto)
    {
        var liability = await _service.CreateLiabilityAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetLiabilities), new { id = liability!.Id }, liability);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLiability(int id)
    {
        var result = await _service.DeleteLiabilityAsync(GetUserId(), id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/decrease")]
    public async Task<IActionResult> DecreaseAmount(int id, [FromBody] DecreaseLiabilityDto dto)
    {
        var liability = await _service.DecreaseLiabilityAmountAsync(GetUserId(), id, dto.Amount);
        if (liability == null) return Ok(new { removed = true });
        return Ok(liability);
    }
}