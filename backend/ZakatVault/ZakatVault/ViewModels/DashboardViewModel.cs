using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Text;
using System.Windows.Input;

using ZakatVault.Models;
using ZakatVault.Services;

namespace ZakatVault.ViewModels;

public class DashboardViewModel: INotifyPropertyChanged
{
    private readonly DashboardService _dashboardService;
    private DashboardSummary? _summary;
    private List<MarketRate>? _rates;
    private List<PortfolioMetric>? _portfolioComposition;
    private string? _message;


    public event PropertyChangedEventHandler? PropertyChanged;

    public DashboardViewModel(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
        LoadCommand = new Command(OnAppearing);
    }

   

    public DashboardSummary? Summary { get => _summary; set { 
        _summary = value;
            OnPropertyChanged(nameof(Summary));
        } }

    public List<MarketRate>? Rates
    {
        get => _rates;
        set
        {
            _rates = value;
            OnPropertyChanged();
        }
    }

    public List<PortfolioMetric>? PortfolioComposition
    {
        get => _portfolioComposition;
        set
        {
            _portfolioComposition = value;
            OnPropertyChanged();
        }
    }

    public ICommand LoadCommand { get; }
    public string? Message
    {
        get => _message;
        set
        {
            if (_message != value)
            {
                _message = value;
                OnPropertyChanged();
            }
        }
    }
    

    private async void OnAppearing()
    {
        try
        {
            Summary = await _dashboardService.GetDashboardSummaryAsync();
            Rates = await _dashboardService.GetMarketRatesAsync();
            PortfolioComposition = await _dashboardService.GetPortfolioCompositionAsync();
        }
        catch (Exception)
        {

            throw;
        }
    }

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

}
