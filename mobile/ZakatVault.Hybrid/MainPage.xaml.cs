using ZakatVault.Hybrid.Services;

namespace ZakatVault.Hybrid;

public partial class MainPage : ContentPage
{
    private readonly NativeBridgeService _bridge;

	public MainPage()
	{
		InitializeComponent();
        _bridge = new NativeBridgeService(this);
        
        hybridWebView.RawMessageReceived += OnRawMessageReceived;
	}

    private async void OnRawMessageReceived(object? sender, HybridWebViewRawMessageReceivedEventArgs e)
    {
        if (e.Message != null)
        {
            await _bridge.HandleMessageAsync(e.Message);
        }
    }
}
