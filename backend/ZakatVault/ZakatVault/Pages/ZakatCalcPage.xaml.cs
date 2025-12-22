using ZakatVault.ViewModels;

namespace ZakatVault.Pages;

public partial class ZakatCalcPage : ContentPage
{
	public ZakatCalcPage(ZakatCalcViewModel viewModel)
	{
		InitializeComponent();
        BindingContext = viewModel;
	}

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is ZakatCalcViewModel viewModel)
        {
            viewModel.LoadCommand.Execute(null);
        }
    }
}
