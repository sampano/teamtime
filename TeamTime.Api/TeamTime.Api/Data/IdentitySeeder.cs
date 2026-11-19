using Microsoft.AspNetCore.Identity;
using TeamTime.Api.Security;
using TeamTime.Api.Models;

namespace TeamTime.Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(
        IServiceProvider services)
    {
        var roleManager = services
            .GetRequiredService<RoleManager<IdentityRole>>();

        string[] roles = { AppRoles.Admin, AppRoles.Member };

        foreach (var role in roles)
        {
            if (await roleManager.RoleExistsAsync(role))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(
                new IdentityRole(role));

            if (!result.Succeeded)
            {
                var errors = string.Join(
                    "; ",
                    result.Errors.Select(error => error.Description));

                throw new InvalidOperationException(
                    $"Could not create role '{role}': {errors}");
            }
        }
    }

    public static async Task SeedAdminAsync(
    IServiceProvider services,
    IConfiguration configuration)
    {
        var userManager = services
            .GetRequiredService<UserManager<ApplicationUser>>();

        // Once an admin exists, do not recreate or change their account.
        var admins = await userManager.GetUsersInRoleAsync(AppRoles.Admin);

        if (admins.Count > 0)
        {
            return;
        }

        var fullName = configuration["BootstrapAdmin:FullName"];
        var email = configuration["BootstrapAdmin:Email"];
        var password = configuration["BootstrapAdmin:Password"];

        if (string.IsNullOrWhiteSpace(fullName)
            || string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Configure BootstrapAdmin credentials in User Secrets.");
        }

        var existingUser = await userManager.FindByEmailAsync(email);

        if (existingUser is not null)
        {
            throw new InvalidOperationException(
                "The bootstrap email already belongs to an account. "
                + "Review it before assigning administrator access.");
        }

        var context = services.GetRequiredService<AppDbContext>();

        await using var transaction =
            await context.Database.BeginTransactionAsync();

        var admin = new ApplicationUser
        {
            UserName = email.Trim(),
            Email = email.Trim(),
            FullName = fullName.Trim(),
            IsActive = true
        };

        var createResult = await userManager.CreateAsync(admin, password);

        if (!createResult.Succeeded)
        {
            var errors = string.Join(
                "; ",
                createResult.Errors.Select(error => error.Description));

            throw new InvalidOperationException(
                $"Could not create administrator: {errors}");
        }

        var roleResult = await userManager.AddToRoleAsync(
            admin,
            AppRoles.Admin);

        if (!roleResult.Succeeded)
        {
            var errors = string.Join(
                "; ",
                roleResult.Errors.Select(error => error.Description));

            throw new InvalidOperationException(
                $"Could not assign administrator role: {errors}");
        }

        await transaction.CommitAsync();
    }
}