using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamTime.Api.Dtos;
using TeamTime.Api.Security;
using TeamTime.Api.Services;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/clients/{clientId:int}/report-shares")]
[Authorize(Roles = AppRoles.Admin)]
public class ClientReportSharesController : ControllerBase
{
    private readonly ClientReportShareService _shareService;

    public ClientReportSharesController(
        ClientReportShareService shareService)
    {
        _shareService = shareService;
    }

    [HttpPost]
    [ResponseCache(
        NoStore = true,
        Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<CreateClientReportShareResponse>> Create(
        int clientId,
        [FromBody] CreateClientReportShareRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var (response, errorCode, error) =
            await _shareService.CreateAsync(
                clientId,
                request,
                currentUserId,
                cancellationToken);

        if (errorCode == "Forbidden")
        {
            return Forbid();
        }

        if (errorCode == "NotFound")
        {
            return NotFound(new { message = error });
        }

        if (errorCode is not null)
        {
            ModelState.AddModelError(
                "ReportShare",
                error ?? "Unable to create the report link.");

            return ValidationProblem(ModelState);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    [HttpGet]
    [ResponseCache(
    NoStore = true,
    Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<List<ClientReportShareResponse>>> GetAll(
    int clientId,
    CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var (shares, errorCode, error) = await _shareService.GetAllAsync(
            clientId,
            currentUserId,
            cancellationToken);

        if (errorCode == "Forbidden")
        {
            return Forbid();
        }

        if (errorCode == "NotFound")
        {
            return NotFound(new { message = error });
        }

        return Ok(shares);
    }

    [HttpPost("{shareId:int}/revoke")]
    public async Task<IActionResult> Revoke(
    int clientId,
    int shareId,
    CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var (errorCode, error) = await _shareService.RevokeAsync(
            clientId,
            shareId,
            currentUserId,
            cancellationToken);

        if (errorCode == "Forbidden")
        {
            return Forbid();
        }

        if (errorCode == "NotFound")
        {
            return NotFound(new { message = error });
        }

        return NoContent();
    }
}