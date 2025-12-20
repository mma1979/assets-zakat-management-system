using ZakatVault.ViewModels;

namespace ZakatVault.Pages;

public partial class RegisterPage : ContentPage
{
	public RegisterPage(RegisterViewModel viewModel)
	{
		InitializeComponent();
        BindingContext = viewModel;
	}

    //private async void OnRegisterClicked(object sender, EventArgs e)
    //{
    //    // TODO: Implement actual registration logic
    //    await DisplayAlertAsync("Register", "Create Account button clicked", "OK");
    //}

    //private async void OnSignInClicked(object sender, EventArgs e)
    //{
    //    await Shell.Current.GoToAsync("..");
    //}


}