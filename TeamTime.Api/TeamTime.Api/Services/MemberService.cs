using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Data;
using TeamTime.Api.Dtos;
using TeamTime.Api.Models;
using TeamTime.Api.Security;

namespace TeamTime.Api.Services;

public class MemberService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;

    public MemberService(
        UserManager<ApplicationUser> userManager,
        AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    //validates the account and password, hashes the password, and saves the account.
    public async Task<(IdentityResult Result, MemberResponse? Member)>
        CreateAsync(CreateMemberRequest request)
    {
        var user = new ApplicationUser
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            IsActive = true
        };

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var createResult = await _userManager.CreateAsync(
            user,
            request.Password);

        if (!createResult.Succeeded)
        {
            return (createResult, null);
        }

        //assigns the existing Member role
        var roleResult = await _userManager.AddToRoleAsync(
            user,
            AppRoles.Member);

        if (!roleResult.Succeeded)
        {
            return (roleResult, null);
        }

        await transaction.CommitAsync();

        var response = new MemberResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email!,
            IsActive = user.IsActive,
            Roles = new List<string> { AppRoles.Member }
        };

        return (IdentityResult.Success, response);
    }

    public async Task<List<MemberResponse>> GetAllAsync()
    {
        var members = await _context.Users
            .AsNoTracking()
            .OrderBy(user => user.FullName)
            .ThenBy(user => user.Id)
            .Select(user => new MemberResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                IsActive = user.IsActive
            })
            .ToListAsync();

        var assignments = await (
            from userRole in _context.UserRoles.AsNoTracking()
            join role in _context.Roles.AsNoTracking()
                on userRole.RoleId equals role.Id
            select new
            {
                userRole.UserId,
                RoleName = role.Name
            })
            .ToListAsync();

        var rolesByUser = assignments
            .Where(assignment => assignment.RoleName is not null)
            .ToLookup(
                assignment => assignment.UserId,
                assignment => assignment.RoleName!);

        foreach (var member in members)
        {
            member.Roles = rolesByUser[member.Id]
                .OrderBy(role => role)
                .ToList();
        }

        return members;
    }

    //update status without deleting account; finds the target account; prvent self-deactivation
    public async Task<(IdentityResult Result, MemberResponse? Member)>
    UpdateStatusAsync(
        string id,
        bool isActive,
        string currentUserId)
    {
        await using var transaction =
        await _context.Database.BeginTransactionAsync();

        var user = await _context.Users
                .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetUsers] WITH (UPDLOCK, HOLDLOCK)
            WHERE [Id] = {id}
            """)
                .AsTracking()
                .SingleOrDefaultAsync();

        if (user is null)
        {
            return (IdentityResult.Failed(new IdentityError
            {
                Code = "MemberNotFound",
                Description = "The account was not found."
            }), null);
        }

        await _context.Entry(user).ReloadAsync();

        if (!isActive && user.Id == currentUserId)
        {
            return (IdentityResult.Failed(new IdentityError
            {
                Code = "SelfDeactivation",
                Description = "You cannot deactivate your own account."
            }), null);
        }

        // Administrator account management is separate from member management.
        if (await _userManager.IsInRoleAsync(user, AppRoles.Admin))
        {
            return (IdentityResult.Failed(new IdentityError
            {
                Code = "AdminAccountProtected",
                Description =
                    "Administrator accounts cannot be changed through this operation."
            }), null);
        }

        if (!isActive)
        {
            var hasRunningTimer = await _context.RunningTimers
                .AnyAsync(timer => timer.MemberId == user.Id);

            if (hasRunningTimer)
            {
                return (IdentityResult.Failed(new IdentityError
                {
                    Code = "MemberHasRunningTimer",
                    Description =
                        "This member must stop their running timer before deactivation."
                }), null);
            }
        }

        if (user.IsActive != isActive)
        {
            user.IsActive = isActive;

            var updateResult = await _userManager.UpdateAsync(user);

            if (!updateResult.Succeeded)
            {
                return (updateResult, null);
            }

            var stampResult =
                await _userManager.UpdateSecurityStampAsync(user);

            if (!stampResult.Succeeded)
            {
                return (stampResult, null);
            }
        }

        await transaction.CommitAsync();

        return (IdentityResult.Success, new MemberResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            IsActive = user.IsActive,
            Roles = (await _userManager.GetRolesAsync(user)).ToList()
        });
    }

    public async Task<(IdentityResult Result, MemberResponse? Member)>
    UpdateRoleAsync(
        string id,
        string role,
        string currentUserId)
    {
        IdentityResult Failure(string code, string message) =>
            IdentityResult.Failed(new IdentityError
            {
                Code = code,
                Description = message
            });

        if (role != AppRoles.Admin && role != AppRoles.Member)
        {
            return (Failure(
                "InvalidRole",
                "Choose either Admin or Member."), null);
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // Serialize role changes so simultaneous requests cannot
        // both demote the remaining active administrators.
        var adminRole = await _context.Roles
            .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetRoles] WITH (UPDLOCK, HOLDLOCK)
            WHERE [NormalizedName] = {"ADMIN"}
            """)
            .AsNoTracking()
            .SingleOrDefaultAsync();

        if (adminRole is null)
        {
            return (Failure(
                "RoleNotFound",
                "The Admin role has not been configured."), null);
        }

        var actor = await _context.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Id == currentUserId);

        var actorIsAdmin = actor is not null
            && actor.IsActive
            && await _context.UserRoles.AnyAsync(assignment =>
                assignment.UserId == currentUserId
                && assignment.RoleId == adminRole.Id);

        if (!actorIsAdmin)
        {
            return (Failure(
                "Forbidden",
                "An active administrator account is required."), null);
        }

        if (id == currentUserId)
        {
            return (Failure(
                "SelfRoleChange",
                "You cannot change your own role."), null);
        }

        var user = await _context.Users
            .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetUsers] WITH (UPDLOCK, HOLDLOCK)
            WHERE [Id] = {id}
            """)
            .AsTracking()
            .SingleOrDefaultAsync();

        if (user is null)
        {
            return (Failure(
                "MemberNotFound",
                "The account was not found."), null);
        }

        await _context.Entry(user).ReloadAsync();

        if (!user.IsActive && role == AppRoles.Admin)
        {
            return (Failure(
                "InactiveAccount",
                "Reactivate this account before promoting it to Admin."), null);
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

        if (currentRoles.Contains(AppRoles.Admin)
            && role == AppRoles.Member)
        {
            var anotherActiveAdminExists = await (
                from account in _context.Users
                join assignment in _context.UserRoles
                    on account.Id equals assignment.UserId
                where account.IsActive
                    && account.Id != user.Id
                    && assignment.RoleId == adminRole.Id
                select account.Id)
                .AnyAsync();

            if (!anotherActiveAdminExists)
            {
                return (Failure(
                    "LastActiveAdmin",
                    "The last active administrator cannot be demoted."), null);
            }
        }

        var rolesToRemove = currentRoles
            .Where(existingRole =>
                (existingRole == AppRoles.Admin
                    || existingRole == AppRoles.Member)
                && existingRole != role)
            .ToArray();

        var needsNewRole = !currentRoles.Contains(role);

        if (rolesToRemove.Length > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(
                user,
                rolesToRemove);

            if (!removeResult.Succeeded)
            {
                return (removeResult, null);
            }
        }

        if (needsNewRole)
        {
            var addResult = await _userManager.AddToRoleAsync(user, role);

            if (!addResult.Succeeded)
            {
                return (addResult, null);
            }
        }

        if (rolesToRemove.Length > 0 || needsNewRole)
        {
            var stampResult =
                await _userManager.UpdateSecurityStampAsync(user);

            if (!stampResult.Succeeded)
            {
                return (stampResult, null);
            }
        }

        var updatedRoles = await _userManager.GetRolesAsync(user);

        await transaction.CommitAsync();

        return (IdentityResult.Success, new MemberResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            IsActive = user.IsActive,
            Roles = updatedRoles.OrderBy(value => value).ToList()
        });
    }

    public async Task<IdentityResult> ResetPasswordAsync(
    string id,
    ResetMemberPasswordRequest request,
    string currentUserId)
    {
        IdentityResult Failure(string code, string message) =>
            IdentityResult.Failed(new IdentityError
            {
                Code = code,
                Description = message
            });

        if (request.NewPassword != request.ConfirmPassword)
        {
            return Failure(
                "PasswordMismatch",
                "The new passwords do not match.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        // Coordinate with role changes while checking permissions.
        var adminRole = await _context.Roles
            .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetRoles] WITH (UPDLOCK, HOLDLOCK)
            WHERE [NormalizedName] = {"ADMIN"}
            """)
            .AsNoTracking()
            .SingleOrDefaultAsync();

        if (adminRole is null)
        {
            return Failure(
                "RoleNotFound",
                "The Admin role has not been configured.");
        }

        var actorIsAdmin = await (
            from account in _context.Users
            join assignment in _context.UserRoles
                on account.Id equals assignment.UserId
            where account.Id == currentUserId
                && account.IsActive
                && assignment.RoleId == adminRole.Id
            select account.Id)
            .AnyAsync();

        if (!actorIsAdmin)
        {
            return Failure(
                "Forbidden",
                "An active administrator account is required.");
        }

        if (id == currentUserId)
        {
            return Failure(
                "SelfPasswordReset",
                "Use the Account page to change your own password.");
        }

        var user = await _context.Users
            .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetUsers] WITH (UPDLOCK, HOLDLOCK)
            WHERE [Id] = {id}
            """)
            .AsTracking()
            .SingleOrDefaultAsync();

        if (user is null)
        {
            return Failure(
                "MemberNotFound",
                "The account was not found.");
        }

        await _context.Entry(user).ReloadAsync();

        if (await _userManager.IsInRoleAsync(user, AppRoles.Admin))
        {
            return Failure(
                "AdminAccountProtected",
                "Administrator passwords cannot be reset through this operation.");
        }

        if (!await _userManager.IsInRoleAsync(user, AppRoles.Member))
        {
            return Failure(
                "InvalidMember",
                "This operation requires an account with the Member role.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        var result = await _userManager.ResetPasswordAsync(
            user,
            token,
            request.NewPassword);

        if (!result.Succeeded)
        {
            return result;
        }

        await transaction.CommitAsync();

        return IdentityResult.Success;
    }
}