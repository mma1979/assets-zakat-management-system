namespace FinanceAPI.Models;

public class VwZakatCalc
{
    public int UserId { get; set; } = 1;
    public decimal TotalAssets { get; set; } = decimal.Zero;
    public decimal TotalDebts { get; set; }= decimal.Zero;
    public decimal NetZakatBase { get; set; }= decimal.Zero;
    public decimal GlodAmount { get; set; } = decimal.Zero;
    public decimal TotalZakatDue { get; set; } = decimal.Zero;
    public decimal TotalPayments { get; set; } = decimal.Zero;
    public decimal RemainingZakatDue { get; set; } = decimal.Zero;
    public decimal NisabGoldValue { get; set; } = decimal.Zero;
    public decimal NisabSilverValue { get; set; } = decimal.Zero;
    public string LunarEndDate { get; set; } = string.Empty;
    public string ZakatStartDate { get; set; } = string.Empty;
    public string ZakatEndDate { get; set; } = string.Empty;
}
