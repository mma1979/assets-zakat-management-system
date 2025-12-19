using Microsoft.EntityFrameworkCore;
using FinanceAPI.Models;

namespace FinanceAPI.Data;

public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<PriceAlert> PriceAlerts { get; set; }
    public DbSet<ZakatConfig> ZakatConfigs { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Liability> Liabilities { get; set; }
    public DbSet<Rate> Rates { get; set; }

   
    public DbSet<VwZakatCalc> VwZakatCalc { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VwZakatCalc>()
          .ToView("VW_ZakatCalc", "dbo")
          .HasNoKey();

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // PriceAlert Configuration
        modelBuilder.Entity<PriceAlert>(entity =>
        {
            entity.ToTable("PriceAlerts");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.AssetType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TargetPrice).HasColumnType("decimal(18,2)");
        });

        // ZakatConfig Configuration
        modelBuilder.Entity<ZakatConfig>(entity =>
        {
            entity.ToTable("ZakatConfigs");
            entity.HasKey(e => e.UserId);
            entity.HasOne(e => e.User)
                  .WithOne()
                  .HasForeignKey<ZakatConfig>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Email).HasMaxLength(255);

        });

        // Transaction Configuration
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AssetType).HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PricePerUnit).HasColumnType("decimal(18,2)");
        });

        // Liability Configuration
        modelBuilder.Entity<Liability>(entity =>
        {
            entity.ToTable("Liabilities");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
        });

        // Rate Configuration
        modelBuilder.Entity<Rate>(entity =>
        {
            entity.ToTable("Rates");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Value).HasColumnType("decimal(18,6)");
            entity.Property(e => e.LastUpdated).HasDefaultValueSql("GETUTCDATE()");

            entity.HasData(new Rate
            {
                Id = 1,
                Name = "GOLD",
                Value = 6389m,
            },
            new Rate
            {
                Id = 2,
                Name = "GOLD_21",
                Value = 5856m,
            },
            new Rate
            {
                Id = 3,
                Name = "SILVER",
                Value = 105.90m,
            }, new Rate
            {
                Id = 4,
                Name = "USD",
                Value = 47.56m,
            }, new Rate
            {
                Id = 5,
                Name = "EGP",
                Value =1m,
            });
        });
    }
}