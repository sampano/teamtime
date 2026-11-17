using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;
using TeamTime.Api.Dtos;
using TeamTime.Api.Exports;
using TeamTime.Api.Security;
using TeamTime.Api.Services;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly TimeEntryService _timeEntryService;

    public TimeEntriesController(
        TimeEntryService timeEntryService)
    {
        _timeEntryService = timeEntryService;
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntryResponse>> CreateTimeEntry(
        [FromBody] CreateTimeEntryRequest request)
    {
        var memberId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(memberId))
        {
            return Unauthorized();
        }

        var (entry, error) = await _timeEntryService.CreateAsync(
            request,
            memberId);

        if (error is not null)
        {
            ModelState.AddModelError("TimeEntry", error);

            return ValidationProblem(ModelState);
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = entry!.Id },
            entry);
    }

    [HttpGet]
    public async Task<ActionResult<List<TimeEntryResponse>>> GetAll(
    [FromQuery] TimeEntryQuery filters)
    {
        var entries = await _timeEntryService.GetAllAsync(filters);

        return Ok(entries);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TimeEntryResponse>> GetById(int id)
    {
        var entry = await _timeEntryService.GetByIdAsync(id);

        if (entry is null)
        {
            return NotFound();
        }

        return Ok(entry);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TimeEntryResponse>> UpdateTimeEntry(
    int id,
    [FromBody] UpdateTimeEntryRequest request)
    {
        var currentUserId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }

        var isAdmin = User.IsInRole(AppRoles.Admin);

        var (entry, errorCode, error) =
            await _timeEntryService.UpdateAsync(
                id,
                request,
                currentUserId,
                isAdmin);

        if (errorCode == "NotFound")
        {
            return NotFound(new { message = error });
        }

        if (errorCode == "Forbidden")
        {
            return Forbid();
        }

        if (errorCode is not null)
        {
            ModelState.AddModelError(
                "TimeEntry",
                error ?? "Unable to update the time entry.");

            return ValidationProblem(ModelState);
        }

        return Ok(entry);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TimeEntrySummaryResponse>> GetSummary(
    [FromQuery] TimeEntryQuery filters)
    {
        var summary = await _timeEntryService.GetSummaryAsync(filters);

        return Ok(summary);
    }

    [HttpGet("export")]
    public async Task Export(
    [FromQuery] TimeEntryQuery filters,
    CancellationToken cancellationToken)
    {
        var fileName =
            $"teamtime-entries-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}.csv";

        Response.ContentType = "text/csv; charset=utf-8";
        Response.Headers.ContentDisposition =
            $"attachment; filename=\"{fileName}\"";
        Response.Headers.CacheControl = "no-store";

        await using var writer = new StreamWriter(
            Response.Body,
            new UTF8Encoding(encoderShouldEmitUTF8Identifier: true),
            bufferSize: 4096,
            leaveOpen: true)
        {
            NewLine = "\r\n"
        };

        await writer.WriteLineAsync(
            TimeEntryCsvFormatter.Header.AsMemory(),
            cancellationToken);

        await foreach (var entry in _timeEntryService
            .GetForExport(filters)
            .WithCancellation(cancellationToken))
        {
            await writer.WriteLineAsync(
                TimeEntryCsvFormatter.FormatRow(entry).AsMemory(),
                cancellationToken);
        }

        await writer.FlushAsync(cancellationToken);
    }
}