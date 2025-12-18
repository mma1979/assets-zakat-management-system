using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValuesController(IGeminiService geminiService) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> Get()
        {

            var rates = await geminiService.FetchMarketRatesAsync();
            return Ok(rates);
        }
    }
}
