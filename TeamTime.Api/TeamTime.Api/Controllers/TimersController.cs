using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TeamTime.Api.Dtos;
using TeamTime.Api.Services;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/timers")]
[Authorize]
public class TimersController : ControllerBase
{
    private readonly TimerService _timerService;

    public TimersController(TimerService timerService)
    {
        _timerService = timerService;
    }

    [HttpPost("start")]
    public async Task<ActionResult<RunningTimerResponse>> StartTimer(
        [FromBody] StartTimerRequest request)
    {
        var memberId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(memberId))
        {
            return Unauthorized();
        }

        var (timer, errorCode, error) =
            await _timerService.StartAsync(request, memberId);

        if (errorCode == "Unauthorized")
        {
            return Unauthorized(new { message = error });
        }

        if (errorCode == "Conflict")
        {
            return Conflict(new { message = error });
        }

        if (errorCode is not null)
        {
            ModelState.AddModelError(
                "Timer",
                error ?? "Unable to start the timer.");

            return ValidationProblem(ModelState);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            timer);
    }

    [HttpGet("current")]
    public async Task<ActionResult<RunningTimerResponse>> GetCurrentTimer()
    {
        var memberId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(memberId))
        {
            return Unauthorized();
        }

        var timer = await _timerService.GetCurrentAsync(memberId);

        if (timer is null)
        {
            return NoContent();
        }

        return Ok(timer);
    }

    [HttpPost("{id:int}/stop")]
    public async Task<ActionResult<TimeEntryResponse>> StopTimer(int id)
    {
        var memberId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(memberId))
        {
            return Unauthorized();
        }

        var (entry, errorCode, error) =
            await _timerService.StopAsync(id, memberId);

        if (errorCode == "NotFound")
        {
            return NotFound(new { message = error });
        }

        if (errorCode == "Unauthorized")
        {
            return Unauthorized(new { message = error });
        }

        if (errorCode == "Conflict")
        {
            return Conflict(new { message = error });
        }

        if (errorCode is not null)
        {
            ModelState.AddModelError(
                "Timer",
                error ?? "Unable to stop the timer.");

            return ValidationProblem(ModelState);
        }

        return CreatedAtAction(
            nameof(TimeEntriesController.GetById),
            "TimeEntries",
            new { id = entry!.Id },
            entry);
    }

}