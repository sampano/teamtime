using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamTime.Api.Dtos;
using TeamTime.Api.Services;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/public/client-reports")]
[AllowAnonymous]
[ResponseCache(
    NoStore = true,
    Location = ResponseCacheLocation.None)]
public class PublicClientReportsController : ControllerBase
{
    private readonly ClientReportShareService _shareService;

    public PublicClientReportsController(
        ClientReportShareService shareService)
    {
        _shareService = shareService;
    }

    [HttpGet("{token}")]
    public async Task<ActionResult<ClientReportResponse>> GetReport(
        string token,
        [FromQuery] ClientReportQuery query,
        CancellationToken cancellationToken)
    {
        Response.Headers["Referrer-Policy"] = "no-referrer";
        Response.Headers["X-Robots-Tag"] =
            "noindex, nofollow, noarchive";

        var report = await _shareService.GetPublicReportAsync(
            token,
            query,
            cancellationToken);

        if (report is null)
        {
            return NotFound(new
            {
                message =
                    "This report link is unavailable or has expired."
            });
        }

        return Ok(report);
    }
}