using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinanceAPI.Data;

public class FinanceDbFactory : IDesignTimeDbContextFactory<FinanceDbContext>
{
    public FinanceDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FinanceDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ?? "Server=.;Database=FinanceDB;User Id=sa;Password=Abc@1234;TrustServerCertificate=True;MultipleActiveResultSets=True;Max Pool Size=200;";
        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("FinanceAPI"));
        return new FinanceDbContext(optionsBuilder.Options);
    }
}
