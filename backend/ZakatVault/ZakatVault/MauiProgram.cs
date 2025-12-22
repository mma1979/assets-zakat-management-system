using Microsoft.Extensions.Logging;

using ZakatVault.Pages;
using ZakatVault.Services;
using ZakatVault.ViewModels;

namespace ZakatVault;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});


		builder.Services.AddSingleton<LoginPage>();
		builder.Services.AddSingleton<LoginViewModel>();

		builder.Services.AddSingleton<RegisterPage>();
		builder.Services.AddSingleton<RegisterViewModel>();

		builder.Services.AddSingleton<AssetsPage>();

		builder.Services.AddSingleton<DashboardPage>();
		builder.Services.AddSingleton<DashboardViewModel>();

		builder.Services.AddSingleton<LiabilitiesPage>();
		builder.Services.AddSingleton<LiabilitiesPage>();
		builder.Services.AddSingleton<ZakatCalcPage>();
        builder.Services.AddSingleton<ZakatCalcViewModel>();

		builder.Services.AddSingleton<AuthService>();
		builder.Services.AddSingleton<SecureStorageService>();
		builder.Services.AddSingleton<ZakatService>();
		builder.Services.AddSingleton<DashboardService>();

		builder.Services.AddSingleton<ZakatSetupPage>();
		builder.Services.AddSingleton<ZakatSetupViewModel>();

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
