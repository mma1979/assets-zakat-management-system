using FinanceAPI.Models;

using Google.GenAI;
using Google.GenAI.Types;

using Microsoft.Identity.Client;

using OpenTelemetry.Resources;

using RestSharp;

using System.Buffers.Text;

using static System.Runtime.InteropServices.JavaScript.JSType;


public interface IGeminiService
{
    Task<RatesRequest?> FetchMarketRatesAsync();
}

public class GeminiService : IGeminiService
{
    private readonly IConfiguration _configuration;
    private readonly string _geminiApiKey;

    public GeminiService(IConfiguration configuration)
    {
        _configuration = configuration;
        _geminiApiKey = _configuration["GeminiApiKey"] ?? throw new ArgumentNullException("GeminiApiKey is not configured");
    }

    public async Task<RatesRequest?> FetchMarketRatesAsync()
    {
        var promptText = """
                        Search for the current market prices in Egypt today. 
            I need:
            1. Gold Buy price per gram for 24k in EGP.
            2. Gold Buy price per gram for 21k in EGP.
            3. Silver Buy price per gram in EGP.
            4. USD to EGP official bank Buy exchange rate.

            for gold use prices from https://egypt.gold-era.com/gold-price/
            for silver use prices from https://www.sabika.app/#Calculator

            Return ONLY a text block with these exact labels and values:
            GOLD_EGP: <value>
            GOLD21_EGP: <value>
            SILVER_EGP: <value>
            USD_EGP: <value>
            """;

        var client = new Client(apiKey: _geminiApiKey);
        var response = await client.Models.GenerateContentAsync(
            model: "gemini-2.5-flash", contents: promptText, config: new GenerateContentConfig
            {
                Tools = [new Tool { GoogleSearch = new GoogleSearch() }]
            });

        if (response == null || response.Candidates == null || response.Candidates.Count <= 0)
        {
            return null;
        }

        var text = response!.Candidates![0].Content!.Parts![0].Text!;

        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var rates = new Dictionary<string, decimal>();
        foreach (var line in lines)
        {
            var parts = line.Split(':', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && decimal.TryParse(parts[1].Trim(), out var value))
            {
                rates[parts[0].Trim()] = value;
            }
        }
        // Here you can use the extracted rates as needed
        // For example:
        if (rates.TryGetValue("GOLD_EGP", out var goldEgP) &&
            rates.TryGetValue("GOLD21_EGP", out var gold21EgP) &&
            rates.TryGetValue("SILVER_EGP", out var silverEgP) &&
            rates.TryGetValue("USD_EGP", out var usdEgP))
        {
            // Use the rates as needed
            return new RatesRequest
            {
                gold_egp = goldEgP,
                gold21_egp = gold21EgP,
                silver_egp = silverEgP,
                usd_egp = usdEgP
            };
        }

        return null;
    }
}
