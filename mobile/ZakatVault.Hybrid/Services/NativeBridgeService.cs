using System.Text.Json;

namespace ZakatVault.Hybrid.Services;

public class NativeBridgeService
{
    private readonly Page _page;

    public NativeBridgeService(Page page)
    {
        _page = page;
    }

    public async Task HandleMessageAsync(string message)
    {
        try
        {
            var payload = JsonSerializer.Deserialize<BridgePayload>(message);
            if (payload == null) return;

            switch (payload.Method)
            {
                case "haptic":
                    HapticFeedback.Default.Perform(HapticFeedbackType.Click);
                    break;
                case "biometric":
                    await _page.DisplayAlert("Biometrics", "Biometric authentication requested (Mock)", "OK");
                    break;
                // Add more native features here
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Error handling bridge message: {ex.Message}");
        }
    }

    private class BridgePayload
    {
        public string Method { get; set; } = string.Empty;
        public object? Args { get; set; }
    }
}
