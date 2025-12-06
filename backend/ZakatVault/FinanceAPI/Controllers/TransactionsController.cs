using FinanceAPI.Models;
using FinanceAPI.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.Security.Claims;

namespace FinanceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var transactions = await _service.GetUserTransactionsAsync(GetUserId());
        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
    {
        var transaction = await _service.CreateTransactionAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetTransactions), new { id = transaction!.Id }, transaction);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        var result = await _service.DeleteTransactionAsync(GetUserId(), id);
        if (!result) return NotFound();
        return NoContent();
    }
}