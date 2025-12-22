using Microsoft.Extensions.DependencyInjection;

namespace ZakatVault;

public partial class App : Application
{
	public App()
	{
        //Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("YOUR LICENSE KEY");
        InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		return new Window(new AppShell());
	}
}