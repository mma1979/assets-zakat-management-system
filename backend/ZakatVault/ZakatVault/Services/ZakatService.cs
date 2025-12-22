using System.Net.Http.Json;
using System.Text.Json;
using ZakatVault.Models;

namespace ZakatVault.Services;

public class ZakatService
{
    private readonly HttpClient _httpClient;
    private readonly AuthService _authService;
    private const string ApiBaseUrl = "http://localhost:5000";

    public ZakatService(AuthService authService)
    {
        _authService = authService;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task<bool> SaveConfigAsync(ZakatConfigRequest config)
    {
        try
        {
            var token = await _authService.GetTokenAsync();
            if (string.IsNullOrEmpty(token))
                return false;

            var request = new HttpRequestMessage(HttpMethod.Post, $"{ApiBaseUrl}/api/zakat-config");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            request.Content = JsonContent.Create(config);

            var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<ZakatCalculationResult?> GetZakatCalculationAsync()
    {
        // Mock implementation for UI design
        await Task.Delay(500); 

        return new ZakatCalculationResult
        {
            DueDate = new DateTime(2026, 7, 23),
            HijriDueDate = "09-02-1448",
            DaysRemaining = 213,
            TotalZakatDue = 16831.96m,
            TotalAssets = 1096931.404m,
            DeductibleLiabilities = 423653m,
            NetZakatBase = 673278.4m,
            IsNisabMet = true,
            GoldNisab = new NisabInfo
            {
                ThresholdGrams = 85,
                PricePerGram = 6644.77m,
                ThresholdValue = 564401.7m
            },
            SilverNisab = new NisabInfo
            {
                ThresholdGrams = 595,
                PricePerGram = 120.84m,
                ThresholdValue = 61314.75m
            }
        };
    }
}
