using FinanceAPI.Consts;
using FinanceAPI.Converters;
using FinanceAPI.Data;
using FinanceAPI.Services;

using Hangfire;
using Hangfire.Dashboard.BasicAuthorization;
using Hangfire.SqlServer;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

using Scalar.AspNetCore;

using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddRazorPages();

// Configure OpenAPI
builder.Services.AddOpenApi();

// Database Context
builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("FinanceDbConnection")));

// JWT Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

//Add Hangfire services
try
{
    builder.Services.AddHangfire(configuration => configuration
.UseSqlServerStorage(builder.Configuration.GetConnectionString("FinanceDbConnection"),
    new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.FromSeconds(5),
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true,
        TryAutoDetectSchemaDependentOptions = true

    })
.WithJobExpirationTimeout(TimeSpan.FromHours(1)));

builder.Services.AddHangfireServer(con =>
{
    con.ServerName = $"zakatvault-{Environment.MachineName}-{Process.GetCurrentProcess().Id}";
    con.Queues = [QueuesNames.DEFAULT, QueuesNames.NOTIFICATIONS, QueuesNames.OTHER];
    con.ServerTimeout = TimeSpan.FromMinutes(1);
    con.CancellationCheckInterval = TimeSpan.FromSeconds(30);
    con.HeartbeatInterval = TimeSpan.FromSeconds(10);
    con.WorkerCount = 5;
});
}
catch (Exception ex)
{

    Console.WriteLine(ex.ToString());
}

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPriceAlertService, PriceAlertService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ILiabilityService, LiabilityService>();
builder.Services.AddScoped<IRatesService, RatesService>();
builder.Services.AddScoped<IZakatConfigService, ZakatConfigService>();
builder.Services.AddScoped<IZakatCalcService, ZakatCalcService>();
builder.Services.AddScoped<IZakatPaymentService, ZakatPaymentService>();
builder.Services.AddScoped<IZakatCycleService, ZakatCycleService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IGeminiService, GeminiService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<HangfireService>();
builder.Services.AddScoped<RazorComponentCompiler>();
builder.Services.AddScoped<ResendService>();
builder.Services.AddHttpContextAccessor();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


builder.Services.Configure<JsonOptions>(options =>
{
   
    // Property naming - camelCase is standard for modern APIs
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;

    // Null handling - omit nulls to reduce payload size
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;

    // Indentation - readable in dev, compact in production
    options.SerializerOptions.WriteIndented = builder.Environment.IsDevelopment();

    // Enum handling - strings are more readable and API-friendly
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));

    // Number handling - allow strings for better JS compatibility
    options.SerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;

    // Circular reference handling - prevent errors
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

    // Security - prevent deep nesting attacks
    options.SerializerOptions.MaxDepth = 32;

    // Case-insensitive property matching for deserialization
    options.SerializerOptions.PropertyNameCaseInsensitive = true;

    // Allow trailing commas in JSON (more forgiving parsing)
    options.SerializerOptions.AllowTrailingCommas = true;

    // Read comments in JSON (useful for config files)
    options.SerializerOptions.ReadCommentHandling = JsonCommentHandling.Skip;

    // Add Converters
    options.SerializerOptions.Converters.Add(new DateOnlyJsonConverter());
    options.SerializerOptions.Converters.Add(new UnixMillisecondsDateTimeConverter());
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));



});


// Aspire Service Defaults
builder.AddServiceDefaults();

var app = builder.Build();

var factory = new FinanceDbFactory();
using var context = factory.CreateDbContext(Array.Empty<string>());

try
{
   // Log.Information("Starting database migration...");

    // Get applied migrations before running
    var appliedBefore = context.Database.GetAppliedMigrations().ToHashSet();

    // Run migrations
    context.Database.Migrate();

    // Get applied migrations after running
    var appliedAfter = context.Database.GetAppliedMigrations().ToHashSet();

    // Find newly applied migrations
    var newlyApplied = appliedAfter.Except(appliedBefore).ToList();

   // Log.Information($"Migration completed successfully. {newlyApplied.Count} new migration(s) applied.");

}
catch (Exception)
{
    //Log.Error(e.Message, e);
}

// Configure the HTTP request pipeline
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("Finance API")
        .WithTheme(ScalarTheme.Mars)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection(); 
}
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapRazorPages();

// Aspire defaults
app.MapDefaultEndpoints();

// Hangfire Dashboard

try
{
    app.UseHangfireDashboard(builder.Configuration["HangfireSettings:DashboardPath"] ?? "/hangfire", new DashboardOptions
    {
        Authorization = new[] { new BasicAuthAuthorizationFilter(new BasicAuthAuthorizationFilterOptions
    {
        SslRedirect = false,
        RequireSsl = false,
        LoginCaseSensitive = true,
        Users =
        [
            new BasicAuthAuthorizationUser
            {
                Login = builder.Configuration["HangfireSettings:Username"] ?? "admin",
                PasswordClear = builder.Configuration["HangfireSettings:Password"] ?? "admin"
            }
        ]
    }) },
        IgnoreAntiforgeryToken = true
    });

    // register Hangfire jobs
    var scope = app.Services.CreateScope();
    var hangfireService = scope.ServiceProvider.GetRequiredService<HangfireService>();
    hangfireService.EnqueueJobs();
}
catch (Exception ex)
{

    Console.WriteLine(ex.ToString());
}

app.Run();