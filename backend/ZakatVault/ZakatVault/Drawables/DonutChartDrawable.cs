using Microsoft.Maui.Graphics;
using ZakatVault.Models;
using Color = Microsoft.Maui.Graphics.Color;

namespace ZakatVault.Drawables;

public class DonutChartDrawable : IDrawable
{
    public List<PortfolioMetric> Data { get; set; } = new();

    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        if (Data == null || Data.Count == 0)
            return;

        float centerX = dirtyRect.Width / 2;
        float centerY = dirtyRect.Height / 2;
        float radius = Math.Min(centerX, centerY) * 0.8f;
        float innerRadius = radius * 0.6f; // For Donut effect

        float startAngle = 90; // Start from top
        float totalValue = (float)Data.Sum(x => (double)x.Value);

        foreach (var item in Data)
        {
            float sweepAngle = (float)(item.Value / (decimal)totalValue) * 360;

            // Parse color
            if (!Color.TryParse(item.Color, out Color color))
            {
                // Fallback colors if parsing fails
                color = Color.FromRgb(200, 200, 200); 
            }

            canvas.StrokeColor = color;
            canvas.StrokeSize = radius - innerRadius;
            
            // Draw Arc
            // PathArc parameters are center-based or bounding box?
            // DrawArc in MAUI Graphics: x, y, width, height, startAngle, endAngle, clockwise, closed
            // DrawArc is for the stroke.
            
            // Using DrawArc with stroke size creates a thick line which looks like a donut segment
            float strokeRadius = (radius + innerRadius) / 2;
            
            // Note: DrawArc takes top-left x,y and width, height of the bounding rectangle
            canvas.DrawArc(centerX - strokeRadius, centerY - strokeRadius, strokeRadius * 2, strokeRadius * 2, -startAngle, -(startAngle + sweepAngle), true, false);

            startAngle += sweepAngle;
        }
    }
}
