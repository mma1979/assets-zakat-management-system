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
}
