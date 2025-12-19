using FinanceAPI.Data;
using FinanceAPI.Models;

using Google.GenAI;
using Google.GenAI.Types;

using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

using OpenTelemetry.Resources;

using RestSharp;

using System.Buffers.Text;
using System.Collections.Immutable;
using System.Text;

using static System.Runtime.InteropServices.JavaScript.JSType;


public interface IGeminiService
{
    Task<List<RateRequest>?> FetchMarketRatesAsync();
}

public class GeminiService : IGeminiService
{
    private readonly FinanceDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly string _geminiApiKey;

    public GeminiService(IConfiguration configuration, FinanceDbContext context)
    {
        _configuration = configuration;
        _geminiApiKey = _configuration["GeminiApiKey"] ?? throw new ArgumentNullException("GeminiApiKey is not configured");
        _context = context;
    }

    public async Task<List<RateRequest>?> FetchMarketRatesAsync()
    {
        var rates = await _context.Rates
            .AsNoTracking()
            .ToListAsync();

        StringBuilder sb = new("""
                        Search for the current market prices in Egypt today. 
            I need:
            """);
        rates.ForEach(r => sb.AppendLine($"\"{r.Name}\": Price of {r.Name} in EGP`"));
        sb.AppendLine("""
            for gold use prices from https://egypt.gold-era.com/gold-price/
            for silver use prices from https://www.sabika.app/#Calculator
            Return ONLY a valid JSON object with the exact keys specified above and numeric values.
            Example:
            {
              "GOLD": 3500.50,
              "USD": 49.20
            }
            """);


        var client = new Client(apiKey: _geminiApiKey);
        var response = await client.Models.GenerateContentAsync(
            model: "gemini-2.5-flash", contents: sb.ToString(), config: new GenerateContentConfig
            {
                Tools = [new Tool { GoogleSearch = new GoogleSearch() }]
            });

        if (response == null || response.Candidates == null || response.Candidates.Count <= 0)
        {
            return null;
        }

        var text = response!.Candidates![0].Content!.Parts![0].Text!
            .Replace("\n", " ")
            .Replace("\r", " ")
            .Replace("```json", "")
            .Replace("```", "");

        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(text);
        if (result == null)
        {
            return null;
        }
        List<RateRequest> rateRequests = new();
        foreach (var rate in rates)
        {
            if (result.ContainsKey(rate.Name))
            {
                rateRequests.Add(new RateRequest
                {
                    id = rate.Id,
                    value = result[rate.Name]
                });
            }
        }
        return rateRequests;

    }
}
