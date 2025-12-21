using ZakatVault.ViewModels;

namespace ZakatVault.Pages;

public partial class ZakatSetupPage : ContentPage
{
	public ZakatSetupPage(ZakatSetupViewModel viewModel)
	{
		InitializeComponent();
		BindingContext = viewModel;
	}
}