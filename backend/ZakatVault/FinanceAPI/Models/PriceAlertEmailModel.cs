namespace FinanceAPI.Models
{
    public class PriceAlertEmailModel
    {
        public string AssetType { get; set; } = string.Empty;
        public string CurrentPrice { get; set; } = "0";
        public string TargetPrice { get; set; } = "0";
        public string Condition { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Change
        {
            get
            {
                decimal current = decimal.Parse(CurrentPrice);
                decimal target = decimal.Parse(TargetPrice);
                decimal changeValue = 0;
                if (Condition == "Above" && current > target)
                {
                    changeValue = current - target;
                }
                else if (Condition == "Below" && current < target)
                {
                    changeValue = target - current;
                }
                return changeValue.ToString("F2");
            }
        }

        public string ChangePercent
        {
            get { 
              var percent = (decimal.Parse(Change) / decimal.Parse(TargetPrice)) * 100;
                return percent.ToString("F2");
            }
        }

        public string DirectionLabel
        {
            get
            {
                return Condition == "Above" ? "increased" : "decreased";
            }
        }

        public string Color
        {
            get
            {
                return Condition == "Above" ? "green" : "red";
            }
        }
        public string Currency
        {
            get
            {
                var currencySymbols = new Dictionary<string, string>
            {
                { "USD", "$" },
                { "EUR", "€" },
                { "GBP", "£" },
                { "EGP", "£E" },
                { "JPY", "¥" },
                { "CNY", "¥" },
                { "INR", "₹" },
                { "AUD", "A$" },
                { "CAD", "C$" },
                { "CHF", "CHF" }
            };
                return currencySymbols.ContainsKey("EGP") ? currencySymbols["EGP"] : "EGP";
            }
        }
    }
}
