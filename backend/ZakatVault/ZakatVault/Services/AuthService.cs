using System;
using System.Collections.Generic;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using ZakatVault.Models;

namespace ZakatVault.Services;

public class AuthService
{
    private readonly HttpClient _httpClient;
    private readonly SecureStorageService _secureStorage;
    private const string ApiBaseUrl = "http://207.180.204.185:9090"; // Change to your API URL

    public AuthService(SecureStorageService secureStorage)
    {
        _secureStorage = secureStorage;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{ApiBaseUrl}/api/auth/register", dto);

            if (!response.IsSuccessStatusCode)
            {
                return new AuthResponseDto
                {
                    Message = "Register failed"
                };
            }

            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

            if (!string.IsNullOrEmpty(result?.Token))
            {
                await _secureStorage.SetAsync("auth_token", result.Token);
                await _secureStorage.SetAsync("app_language", "en");
                await _secureStorage.SetAsync("auth_user", JsonSerializer.Serialize(result));

                return result;
            }

            return new AuthResponseDto
            {
                Message = "Register failed"
            };
        }
        catch (Exception ex)
        {
            return new AuthResponseDto
            {
                Message = $"Error: {ex.Message}"
            };
        }
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{ApiBaseUrl}/api/auth/login", dto);

            if (!response.IsSuccessStatusCode)
            {
                return new AuthResponseDto
                {
                    Message = "Login failed"
                };
            }

            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

            if (!string.IsNullOrEmpty(result?.Token))
            {
                await _secureStorage.SetAsync("auth_token", result.Token);
                await _secureStorage.SetAsync("app_language", "en");
                await _secureStorage.SetAsync("auth_user", JsonSerializer.Serialize(result));

                return result;
            }

            return  new AuthResponseDto
            {
                Message = "Login failed"
            };
        }
        catch (Exception ex)
        {
            return new AuthResponseDto
            {
                Message = $"Error: {ex.Message}"
            };
        }
    }

    public async Task<string?> GetTokenAsync()
    {
        return await _secureStorage.GetAsync("auth_token");
    }

    public async Task<bool> IsAuthenticatedAsync()
    {
        var token = await GetTokenAsync();
        return !string.IsNullOrEmpty(token);
    }

    public async Task LogoutAsync()
    {
        await _secureStorage.RemoveAsync("auth_token");
        await _secureStorage.RemoveAsync("auth_user");
    }

    public async Task<AuthResponseDto?> GetUserAsync()
    {
        var authUser = await _secureStorage.GetAsync("auth_user");
        if (authUser == null)
        {
            return null;
        }
        return JsonSerializer.Deserialize<AuthResponseDto>(authUser);
    }

}
