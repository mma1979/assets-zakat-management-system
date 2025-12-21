using System.Net.Http.Json;
using System.Text.Json;
using ZakatVault.Models;

namespace ZakatVault.Services;

public class ZakatService
{
    private readonly HttpClient _httpClient;
    private readonly AuthService _authService;
    private const string ApiBaseUrl = "http://207.180.204.185:9090";

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
}
