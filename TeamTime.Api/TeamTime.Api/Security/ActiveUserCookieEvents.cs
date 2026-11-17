using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using TeamTime.Api.Models;

namespace TeamTime.Api.Security;

public class ActiveUserCookieEvents
    : CookieAuthenticationEvents
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ISecurityStampValidator _securityStampValidator;

    public ActiveUserCookieEvents(
        UserManager<ApplicationUser> userManager,
        ISecurityStampValidator securityStampValidator)
    {
        _userManager = userManager;
        _securityStampValidator = securityStampValidator;
    }

    public override async Task ValidatePrincipal(
        CookieValidatePrincipalContext context)
    {
        // Preserve Identity's existing security-stamp validation.
        await _securityStampValidator.ValidateAsync(context);

        if (context.Principal?.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var user = await _userManager.GetUserAsync(
            context.Principal);

        if (user is null || !user.IsActive)
        {
            context.RejectPrincipal();

            await context.HttpContext.SignOutAsync(
                IdentityConstants.ApplicationScheme);
        }
    }

    public override Task RedirectToLogin(
        RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode =
            StatusCodes.Status401Unauthorized;

        return Task.CompletedTask;
    }

    public override Task RedirectToAccessDenied(
        RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode =
            StatusCodes.Status403Forbidden;

        return Task.CompletedTask;
    }
}