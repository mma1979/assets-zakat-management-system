using System;
using System.Collections.Generic;
using System.Text;

namespace ZakatVault.Services;

public class SecureStorageService
{
    public async Task SetAsync(string key, string value) => await SecureStorage.Default.SetAsync(key, value);

    public async Task<string?> GetAsync(string key) => await SecureStorage.Default.GetAsync(key);

    public async Task RemoveAsync(string key)
    {
        SecureStorage.Default.Remove(key);
        await Task.CompletedTask;
    }
}
