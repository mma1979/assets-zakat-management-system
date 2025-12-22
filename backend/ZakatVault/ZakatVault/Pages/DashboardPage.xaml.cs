using ZakatVault.Drawables;
using ZakatVault.ViewModels;

namespace ZakatVault.Pages;

public partial class DashboardPage : ContentPage
{
    private DonutChartDrawable _chartDrawable;

	public DashboardPage(DashboardViewModel viewModel)
	{
		InitializeComponent();
		BindingContext = viewModel;
        _chartDrawable = new DonutChartDrawable();
        PortfolioChart.Drawable = _chartDrawable;
        viewModel.PropertyChanged += ViewModel_PropertyChanged;
    }

    private void ViewModel_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(DashboardViewModel.PortfolioComposition))
        {
            var viewModel = BindingContext as DashboardViewModel;
            if (viewModel?.PortfolioComposition != null)
            {
                _chartDrawable.Data = viewModel.PortfolioComposition;
                PortfolioChart.Invalidate();
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