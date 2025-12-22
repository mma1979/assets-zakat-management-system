using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ZakatVault.Models;
using ZakatVault.Services;

namespace ZakatVault.ViewModels;

public class ZakatCalcViewModel : INotifyPropertyChanged
{
    private readonly ZakatService _zakatService;
    private ZakatCalculationResult? _result;
    private bool _isLoading;

    public event PropertyChangedEventHandler? PropertyChanged;

    public ZakatCalcViewModel(ZakatService zakatService)
    {
        _zakatService = zakatService;
        LoadCommand = new Command(async () => await LoadDataAsync());
    }

    public ZakatCalculationResult? Result
    {
        get => _result;
        set
        {
            _result = value;
            OnPropertyChanged();
        }
    }

    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            _isLoading = value;
            OnPropertyChanged();
        }
    }

    public ICommand LoadCommand { get; }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            Result = await _zakatService.GetZakatCalculationAsync();
        }
        finally
        {
            IsLoading = false;
        }
    }

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
