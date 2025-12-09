namespace ZakatVault;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();

        Routing.RegisterRoute(nameof(Pages.RegisterPage), typeof(Pages.RegisterPage));
        Routing.RegisterRoute("Secure/DashboardPage", typeof(Pages.DashboardPage));
    }

    private async void OnLogoutClicked(object sender, EventArgs e)
    {
        // Navigate to Login Page
        await Shell.Current.GoToAsync("//Login");
    }

    private async void OnChangeLanguageClicked(object sender, EventArgs e)
    {
        string action = await Shell.Current.DisplayActionSheetAsync("Select Language", "Cancel", null, "English", "Arabic");
        
        if (action == "English")
        {
            SetLanguage("en-US");
        }
        else if (action == "Arabic")
        {
            SetLanguage("ar-SA");
        }
    }

    private void SetLanguage(string cultureCode)
    {
        var culture = new System.Globalization.CultureInfo(cultureCode);
        
        // 1. Set Thread Culture
        Thread.CurrentThread.CurrentCulture = culture;
        Thread.CurrentThread.CurrentUICulture = culture;
        System.Globalization.CultureInfo.DefaultThreadCurrentCulture = culture;
        System.Globalization.CultureInfo.DefaultThreadCurrentUICulture = culture;

        // 2. Set Resource Culture explicitly
        ZakatVault.Resources.Strings.AppResources.Culture = culture;

        // 3. Restart the Shell to apply changes
        var newShell = new AppShell();
        
        // 4. Set FlowDirection based on language
        if (culture.TextInfo.IsRightToLeft)
        {
            newShell.FlowDirection = FlowDirection.RightToLeft;
        }
        else
        {
            newShell.FlowDirection = FlowDirection.LeftToRight;
        }

        Application.Current.MainPage = newShell;
    }
}
