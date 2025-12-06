// FinanceAPI.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Add SQL Server
//var sqlServer = builder.AddSqlServer("sqlserver")
//    .WithDataVolume()
//    .AddDatabase("financedb");

// Add the API with SQL Server dependency
var api = builder.AddProject<Projects.FinanceAPI>("financeapi")
    //.WithReference(sqlServer)
    .WithEnvironment("JwtSettings__SecretKey", "YourSuperSecretKeyThatIsAtLeast32CharactersLong123456")
    .WithEnvironment("JwtSettings__Issuer", "FinanceAPI")
    .WithEnvironment("JwtSettings__Audience", "FinanceAPIUsers");

builder.Build().Run();