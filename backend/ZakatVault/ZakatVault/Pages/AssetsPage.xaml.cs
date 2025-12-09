namespace ZakatVault.Pages;

public partial class AssetsPage : ContentPage
{
	public AssetsPage()
	{
		InitializeComponent();
	}

	private async void Button_Clicked(object sender, EventArgs e)
	{
        // open link http://localhost:8080

        await Launcher.OpenAsync("http://localhost:8080/scalar/v1"); // returns bool

    }
}
