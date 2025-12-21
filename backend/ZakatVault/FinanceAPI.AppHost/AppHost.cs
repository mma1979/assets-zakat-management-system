// FinanceAPI.AppHost/Program.cs
using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server
//var sqlServer = builder.AddSqlServer("sqlserver")
//    .WithDataVolume()
//    .AddDatabase("financedb");

// Add the API with SQL Server dependency
var api = builder.AddProject<Projects.FinanceAPI>("financeapi");

builder.AddProject<Projects.ZakatVault>("zakatvault")
    .WaitFor(api);

builder.Build().Run();