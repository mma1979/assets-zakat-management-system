namespace ZakatVault.Pages;



public partial class LoginPage : ContentPage
{
	public LoginPage()
	{
		InitializeComponent();
	}

    private async void OnLoginClicked(object sender, EventArgs e)
    {
        // Navigate to the Dashboard (Tab)
        await Shell.Current.GoToAsync("//Secure/DashboardPage");
    }

    private async void OnForgotPasswordClicked(object sender, EventArgs e)
    {
        // TODO: Navigate to Forgot Password page
        await DisplayAlertAsync("Forgot Password", "Forgot Password clicked", "OK");
    }

    private async void OnSignUpClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(RegisterPage));
    }
}