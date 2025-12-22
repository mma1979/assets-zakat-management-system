using System.Globalization;
using Microsoft.Maui.Graphics;
using ZakatVault.Models;
using Color = Microsoft.Maui.Graphics.Color;
using Font = Microsoft.Maui.Graphics.Font;

namespace ZakatVault.Drawables;

public class LineChartDrawable : IDrawable
{
    public List<PortfolioHistorySeries> Series { get; set; } = new();

    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        if (Series == null || Series.Count == 0)
            return;

        // Configuration
        float margin = 40;
        float chartX = margin + 10; // Extra space for Y-axis labels
        float chartY = margin;
        float chartWidth = dirtyRect.Width - chartX - margin;
        float chartHeight = dirtyRect.Height - chartY - margin - 20; // Extra space for X-axis labels

        // Find Min/Max
        var allPoints = Series.SelectMany(s => s.History).ToList();
        if (allPoints.Count == 0) return;

        var minDate = allPoints.Min(p => p.Date);
        var maxDate = allPoints.Max(p => p.Date);
        var minValue = allPoints.Min(p => p.Value);
        var maxValue = allPoints.Max(p => p.Value);
        
        // Add some padding to Y-axis range
        decimal yRange = maxValue - minValue;
        if (yRange == 0) yRange = 100;
        minValue -= yRange * 0.1m; 
        maxValue += yRange * 0.1m;
        
        // Ensure min value is not greater than 0 if we want to show 0 baseline, 
        // but here values can be negative.
        
        // Grid lines and Y-axis labels
        canvas.StrokeColor = Color.FromArgb("#E0E0E0");
        canvas.StrokeSize = 1;
        canvas.FontColor = Color.FromArgb("#9E9E9E");
        canvas.FontSize = 10;

        int gridLines = 5;
        for (int i = 0; i <= gridLines; i++)
        {
            float y = chartY + chartHeight - (i * (chartHeight / gridLines));
            decimal val = minValue + (i * ((maxValue - minValue) / gridLines));
            
            // Draw grid line
            canvas.DrawLine(chartX, y, chartX + chartWidth, y);
            
            // Draw Label
            string label = FormatValue(val);
            canvas.DrawString(label, 0, y - 5, chartX - 5, 10, HorizontalAlignment.Right, VerticalAlignment.Center);
        }

        // X-Axis Labels (Time)
        // Draw first, middle, last? Or evenly spaced?
        // Let's draw 5 evenly spaced dates
        int timeSteps = 5;
        long totalTicks = maxDate.Ticks - minDate.Ticks;

        for (int i = 0; i <= timeSteps; i++)
        {
            float x = chartX + (i * (chartWidth / timeSteps));
            DateTime date = minDate.AddTicks((long)(i * (totalTicks / (double)timeSteps)));
            string label = date.ToString("dd-MM-yyyy");
            
            // Draw Label
            canvas.DrawString(label, x - 30, chartY + chartHeight + 5, 60, 20, HorizontalAlignment.Center, VerticalAlignment.Top);
        }


        // Draw Series
        foreach (var serie in Series)
        {
            if (serie.History.Count < 2) continue;

            if (!Color.TryParse(serie.Color, out Color color))
                color = Colors.Blue;

            canvas.StrokeColor = color;
            canvas.StrokeSize = 2; // Thicker line for data

            PathF path = new PathF();
            bool first = true;

            // Sort points by date just in case
            var sortedPoints = serie.History.OrderBy(p => p.Date).ToList();

            foreach (var point in sortedPoints)
            {
                float x = chartX + ((float)(point.Date.Ticks - minDate.Ticks) / totalTicks) * chartWidth;
                float y = chartY + chartHeight - ((float)((point.Value - minValue) / (maxValue - minValue)) * chartHeight);

                if (first)
                {
                    path.MoveTo(x, y);
                    first = false;
                }
                else
                {
                    path.LineTo(x, y);
                }
            }
            canvas.DrawPath(path);
        }
    }

    private string FormatValue(decimal value)
    {
        if (Math.Abs(value) >= 1000000)
            return $"{(value / 1000000m):0.#}m";
        if (Math.Abs(value) >= 1000)
            return $"{(value / 1000m):0.#}k";
        return $"{value:0}";
    }
}
