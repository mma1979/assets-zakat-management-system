using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ZakatVault.Models;
using ZakatVault.Services;

namespace ZakatVault.ViewModels;

public class ZakatSetupViewModel : INotifyPropertyChanged
{
    private readonly ZakatService _zakatService;
    
    private DateTime _dueDate = DateTime.Today;
    private string _email = string.Empty;
    private string _geminiApiKey = string.Empty;
    private bool _enableReminder;
    private bool _isLoading;
    private string _statusMessage = string.Empty;

    public event PropertyChangedEventHandler? PropertyChanged;

    public ZakatSetupViewModel(ZakatService zakatService)
    {
        _zakatService = zakatService;
        SaveCommand = new Command(OnSave, () => !IsLoading);
        SkipCommand = new Command(OnSkip);
        OpenUrlCommand = new Command(OpenExternalAsync);
    }

    public DateTime DueDate
    {
        get => _dueDate;
        set
        {
            if (_dueDate != value)
            {
                _dueDate = value;
                OnPropertyChanged();
            }
        }
    }

    public string Email
    {
        get => _email;
        set
        {
            if (_email != value)
            {
                _email = value;
                OnPropertyChanged();
            }
        }
    }

    public string GeminiApiKey
    {
        get => _geminiApiKey;
        set
        {
            if (_geminiApiKey != value)
            {
                _geminiApiKey = value;
                OnPropertyChanged();
            }
        }
    }

    public bool EnableReminder
    {
        get => _enableReminder;
        set
        {
            if (_enableReminder != value)
            {
                _enableReminder = value;
                OnPropertyChanged();
            }
        }
    }

    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            if (_isLoading != value)
            {
                _isLoading = value;
                OnPropertyChanged();
                ((Command)SaveCommand).ChangeCanExecute();
            }
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        set
        {
            if (_statusMessage != value)
            {
                _statusMessage = value;
                OnPropertyChanged();
            }
        }
    }

    public ICommand SaveCommand { get; }
    public ICommand SkipCommand { get; }
    public ICommand OpenUrlCommand { get; }

    private async void OnSave()
    {
        if (IsLoading) return;

        IsLoading = true;
        StatusMessage = string.Empty;

        var config = new ZakatConfigRequest
        {
            ZakatDate = DueDate,
            Email = Email,
            GeminiApiKey = GeminiApiKey,
            ReminderEnabled = EnableReminder
        };

        var success = await _zakatService.SaveConfigAsync(config);

        IsLoading = false;

        if (success)
        {
            await Shell.Current.GoToAsync("//Secure/DashboardPage");
        }
        else
        {
            StatusMessage = "Failed to save configuration. Please try again.";
        }
    }

    private async void OnSkip()
    {
        await Shell.Current.GoToAsync("//Secure/DashboardPage");
    }

    public async void OpenExternalAsync()
    {
        var uri = new Uri("https://aistudio.google.com/app/apikey");

        await Browser.Default.OpenAsync(uri, new BrowserLaunchOptions
        {
            LaunchMode = BrowserLaunchMode.SystemPreferred, // or External
            TitleMode = BrowserTitleMode.Show,
            PreferredToolbarColor = Colors.Blue,
            PreferredControlColor = Colors.White
        });
    }

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
