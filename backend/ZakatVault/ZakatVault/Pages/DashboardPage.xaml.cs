using ZakatVault.Drawables;
using ZakatVault.ViewModels;

namespace ZakatVault.Pages;

public partial class DashboardPage : ContentPage
{
    private DonutChartDrawable _chartDrawable;
    private LineChartDrawable _historyDrawable;

	public DashboardPage(DashboardViewModel viewModel)
	{
		InitializeComponent();
		BindingContext = viewModel;
        
        _chartDrawable = new DonutChartDrawable();
        PortfolioChart.Drawable = _chartDrawable;

        _historyDrawable = new LineChartDrawable();
        HistoryChart.Drawable = _historyDrawable;

        viewModel.PropertyChanged += ViewModel_PropertyChanged;
    }

    private void ViewModel_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        var viewModel = BindingContext as DashboardViewModel;
        if (viewModel == null) return;

        if (e.PropertyName == nameof(DashboardViewModel.PortfolioComposition))
        {
            if (viewModel.PortfolioComposition != null)
            {
                _chartDrawable.Data = viewModel.PortfolioComposition;
                PortfolioChart.Invalidate();
            }
        }
        else if (e.PropertyName == nameof(DashboardViewModel.PortfolioHistory))
        {
            if (viewModel.PortfolioHistory != null)
            {
                _historyDrawable.Series = viewModel.PortfolioHistory;
                HistoryChart.Invalidate();
            }
        }
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is DashboardViewModel viewModel)
        {
            viewModel.LoadCommand.Execute(null);
        }
    }
}