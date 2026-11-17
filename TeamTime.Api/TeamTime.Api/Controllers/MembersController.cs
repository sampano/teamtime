using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TeamTime.Api.Dtos;
using TeamTime.Api.Security;
using TeamTime.Api.Services;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/members")]
public class MembersController : ControllerBase
{
    private readonly MemberService _memberService;

    public MembersController(MemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]

    public async Task<ActionResult<MemberResponse>> CreateMember(
        [FromBody] CreateMemberRequest request)
    {
        var (result, member) =
            await _memberService.CreateAsync(request);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(
                    error.Code,
                    error.Description);
            }

            return ValidationProblem(ModelState);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            member);
    }

    [HttpGet]
    public async Task<ActionResult<List<MemberResponse>>> GetAll()
    {
        var members = await _memberService.GetAllAsync();

        return Ok(members);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<MemberResponse>> UpdateMemberStatus(
    string id,
    [FromBody] UpdateMemberStatusRequest request)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var (result, member) = await _memberService.UpdateStatusAsync(
            id,
            request.IsActive!.Value,
            currentUserId);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(error =>
                error.Code == "MemberNotFound"))
            {
                return NotFound(new
                {
                    message = "The account was not found."
                });
            }

            if (result.Errors.Any(error =>
                error.Code == "ConcurrencyFailure"))
            {
                return Conflict(new
                {
                    message = "The account changed. Refresh and try again."
                });
            }

            if (result.Errors.Any(error =>
                error.Code == "MemberHasRunningTimer"))
            {
                return Conflict(new
                {
                    message =
                        "This member must stop their running timer before deactivation."
                });
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(
                    error.Code,
                    error.Description);
            }

            return ValidationProblem(ModelState);
        }

        return Ok(member);
    }

    [HttpPatch("{id}/role")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<MemberResponse>> UpdateMemberRole(
    string id,
    [FromBody] UpdateMemberRoleRequest request)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var (result, member) = await _memberService.UpdateRoleAsync(
            id,
            request.Role,
            currentUserId);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(error =>
                error.Code == "MemberNotFound"))
            {
                return NotFound(new
                {
                    message = "The account was not found."
                });
            }

            if (result.Errors.Any(error =>
                error.Code == "Forbidden"))
            {
                return Forbid();
            }

            if (result.Errors.Any(error =>
                error.Code is "ConcurrencyFailure" or "LastActiveAdmin"))
            {
                return Conflict(new
                {
                    message = string.Join(
                        " ",
                        result.Errors.Select(error => error.Description))
                });
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(
                    error.Code,
                    error.Description);
            }

            return ValidationProblem(ModelState);
        }

        return Ok(member);
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> ResetMemberPassword(
    string id,
    [FromBody] ResetMemberPasswordRequest request)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var result = await _memberService.ResetPasswordAsync(
            id,
            request,
            currentUserId);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(error =>
                error.Code == "MemberNotFound"))
            {
                return NotFound(new
                {
                    message = "The account was not found."
                });
            }

            if (result.Errors.Any(error =>
                error.Code == "Forbidden"))
            {
                return Forbid();
            }

            if (result.Errors.Any(error =>
                error.Code == "ConcurrencyFailure"))
            {
                return Conflict(new
                {
                    message = "The account changed. Refresh and try again."
                });
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(
                    error.Code,
                    error.Description);
            }

            return ValidationProblem(ModelState);
        }

        return Ok(new
        {
            message = "The member's password was reset successfully."
        });
    }
}