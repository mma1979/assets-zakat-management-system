namespace FinanceAPI.Models;

public class VwZakatCalc
{
    public int UserId { get; set; } = 1;
    public decimal TotalAssets { get; set; } = decimal.Zero;
    public decimal TotalDebts { get; set; }= decimal.Zero;
    public decimal NetZakatBase { get; set; }= decimal.Zero;
    public decimal GlodAmount { get; set; } = decimal.Zero;
    public decimal TotalZakatDue { get; set; } = decimal.Zero;
}
