using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinanceAPI.Data;

public class FinanceDbFactory : IDesignTimeDbContextFactory<FinanceDbContext>
{
    public FinanceDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FinanceDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__FinanceDbConnection") ?? "Server=127.0.0.1,1444;Database=ZakatVaultDb;User Id=sa;Password=Abc@1234;TrustServerCertificate=True;";
        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("FinanceAPI"));
        return new FinanceDbContext(optionsBuilder.Options);
    }
}
