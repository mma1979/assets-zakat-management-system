using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace FinanceAPI.Services;

public class RazorComponentCompiler
{
    private readonly ILoggerFactory _loggerFactory;
    private readonly IServiceProvider _serviceProvider;

    public RazorComponentCompiler(ILoggerFactory loggerFactory, IServiceProvider serviceProvider)
    {
        _loggerFactory = loggerFactory;
        _serviceProvider = serviceProvider;
    }

    public async Task<string> Compile<T>(Dictionary<string, object?> parametersDict) where T : IComponent
    {
        await using var htmlRender = new HtmlRenderer(_serviceProvider, _loggerFactory);
        var html = await htmlRender.Dispatcher.InvokeAsync(async () =>
        {


            var parameters = ParameterView.FromDictionary(parametersDict);
            var output = await htmlRender.RenderComponentAsync<T>(parameters);

            return output.ToHtmlString();
        });

        return html;
    }
}