using System;
using System.Collections.Generic;
using System.Net.Http.Json;
using System.Text;

using ZakatVault.Models;

namespace ZakatVault.Services;

public class DashboardService
{
    private readonly HttpClient _httpClient;
    private readonly AuthService _authService;
    private const string ApiBaseUrl = "http://localhost:5000";
    public DashboardService(AuthService authService)
    {
        _authService = authService;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task<DashboardSummary?> GetDashboardSummaryAsync()
    {
        try
        {
            var token = await _authService.GetTokenAsync();
            if (string.IsNullOrEmpty(token))
                return null;

            var request = new HttpRequestMessage(HttpMethod.Get, $"{ApiBaseUrl}/api/dashboard/summary");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) {
            return null;
            }

            return await response.Content.ReadFromJsonAsync<DashboardSummary>();
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<List<MarketRate>?> GetMarketRatesAsync()
    {
        try
        {
            var token = await _authService.GetTokenAsync();
            if (string.IsNullOrEmpty(token))
                return null;

            var request = new HttpRequestMessage(HttpMethod.Get, $"{ApiBaseUrl}/api/rates");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var rates = await response.Content.ReadFromJsonAsync<List<RateResponse>>();
            return rates.Select(r => new MarketRate
            {
                Name = r.title,
                Price = r.value,
                Unit = "EGP"
            }).ToList();
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<List<PortfolioMetric>?> GetPortfolioCompositionAsync()
    {
        try
        {
            var token = await _authService.GetTokenAsync();
            if (string.IsNullOrEmpty(token))
                return null;

            var request = new HttpRequestMessage(HttpMethod.Get, $"{ApiBaseUrl}/api/dashboard/portfolio-composition");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<List<PortfolioMetric>>();
        }
        catch (Exception)
        {
            return null;
        }
    }
}
