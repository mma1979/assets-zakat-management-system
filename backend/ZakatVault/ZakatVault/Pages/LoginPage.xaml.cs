namespace ZakatVault.Pages;

public partial class LoginPage : ContentPage
{
	public LoginPage()
	{
		InitializeComponent();
	}

    private async void OnLoginClicked(object sender, EventArgs e)
    {
        // TODO: Implement actual login logic
        await DisplayAlert("Login", "Login button clicked", "OK");
    }

    private async void OnForgotPasswordClicked(object sender, EventArgs e)
    {
        // TODO: Navigate to Forgot Password page
        await DisplayAlert("Forgot Password", "Forgot Password clicked", "OK");
    }

    private async void OnSignUpClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(RegisterPage));
    }
}