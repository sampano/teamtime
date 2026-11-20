using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Models;

namespace TeamTime.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();

    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    public DbSet<RunningTimer> RunningTimers => Set<RunningTimer>();

    public DbSet<ClientReportShare> ClientReportShares =>
    Set<ClientReportShare>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(client => client.Id);

            entity.Property(client => client.Name)
                .IsRequired()
                .HasMaxLength(200);
        });

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FullName)
                .IsRequired()
                .HasMaxLength(200);
        });

        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(entry => entry.Id);

            entity.Property(entry => entry.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasOne(entry => entry.Client)
                .WithMany()
                .HasForeignKey(entry => entry.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(entry => entry.Member)
                .WithMany()
                .HasForeignKey(entry => entry.MemberId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(entry => new
            {
                entry.MemberId,
                entry.StartTimeUtc
            });

            entity.HasIndex(entry => new
            {
                entry.ClientId,
                entry.StartTimeUtc
            });

            entity.ToTable("TimeEntries", table =>
            {
                table.HasCheckConstraint(
                    "CK_TimeEntries_EndAfterStart",
                    "[EndTimeUtc] > [StartTimeUtc]");
            });


        });

        modelBuilder.Entity<RunningTimer>(entity =>
        {
            entity.HasKey(timer => timer.Id);

            entity.Property(timer => timer.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(timer => timer.RowVersion)
                .IsRowVersion();

            entity.HasIndex(timer => timer.MemberId)
                .IsUnique();

            entity.HasOne(timer => timer.Member)
                .WithMany()
                .HasForeignKey(timer => timer.MemberId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(timer => timer.Client)
                .WithMany()
                .HasForeignKey(timer => timer.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ClientReportShare>(entity =>
        {
            entity.HasKey(share => share.Id);

            entity.Property(share => share.TokenHash)
                .IsRequired()
                .HasMaxLength(64)
                .IsUnicode(false)
                .IsFixedLength();

            entity.HasIndex(share => share.TokenHash)
                .IsUnique();

            entity.HasIndex(share => new
            {
                share.ClientId,
                share.CreatedAtUtc
            });

            entity.HasOne(share => share.Client)
                .WithMany()
                .HasForeignKey(share => share.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(share => share.CreatedByMember)
                .WithMany()
                .HasForeignKey(share => share.CreatedByMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable("ClientReportShares", table =>
            {
                table.HasCheckConstraint(
                    "CK_ClientReportShares_ValidDateRange",
                    "[FromUtc] IS NULL OR [ToUtc] IS NULL OR [ToUtc] > [FromUtc]");

                table.HasCheckConstraint(
                    "CK_ClientReportShares_ValidExpiration",
                    "[ExpiresAtUtc] IS NULL OR [ExpiresAtUtc] > [CreatedAtUtc]");

                table.HasCheckConstraint(
                    "CK_ClientReportShares_ValidRevocation",
                    "[RevokedAtUtc] IS NULL OR [RevokedAtUtc] >= [CreatedAtUtc]");
            });
        });

    }

}