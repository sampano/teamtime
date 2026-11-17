using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Data;
using TeamTime.Api.Dtos;
using TeamTime.Api.Models;

namespace TeamTime.Api.Services;

public class TimerService
{
    private readonly AppDbContext _context;

    public TimerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(
        RunningTimerResponse? Timer,
        string? ErrorCode,
        string? Error)> StartAsync(
            StartTimerRequest request,
            string memberId)
    {
        var description = request.Description?.Trim();

        if (string.IsNullOrWhiteSpace(description)
            || description.Length > 500)
        {
            return (null, "Validation",
                "A work description of up to 500 characters is required.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var member = await _context.Users
            .FromSqlInterpolated($"""
            SELECT *
            FROM [AspNetUsers] WITH (UPDLOCK, HOLDLOCK)
            WHERE [Id] = {memberId}
            """)
                .AsNoTracking()
                .SingleOrDefaultAsync();

        if (member is null || !member.IsActive)
        {
            return (null, "Unauthorized",
                "An active account is required.");
        }

        var alreadyRunning = await _context.RunningTimers
            .AnyAsync(timer => timer.MemberId == memberId);

        if (alreadyRunning)
        {
            return (null, "Conflict",
                "You already have a running timer.");
        }

        var client = await _context.Clients
            .AsNoTracking()
            .SingleOrDefaultAsync(client =>
                client.Id == request.ClientId);

        if (client is null || !client.IsActive)
        {
            return (null, "Validation",
                "Choose an existing, active client.");
        }

        var timer = new RunningTimer
        {
            MemberId = member.Id,
            ClientId = client.Id,
            Description = description,
            StartTimeUtc = DateTimeOffset.UtcNow
        };

        _context.RunningTimers.Add(timer);

        try
        {
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException sqlException
                && sqlException.Number is 2601 or 2627)
        {
            await transaction.RollbackAsync();

            _context.Entry(timer).State = EntityState.Detached;

            return (null, "Conflict",
                "A timer was already started. Refresh to see it.");
        }

        return (new RunningTimerResponse
        {
            Id = timer.Id,
            ClientId = client.Id,
            ClientName = client.Name,
            MemberId = member.Id,
            MemberName = member.FullName,
            Description = timer.Description,
            StartTimeUtc = timer.StartTimeUtc
        }, null, null);
    }


    public async Task<RunningTimerResponse?> GetCurrentAsync(
    string memberId)
    {
        return await _context.RunningTimers
            .AsNoTracking()
            .Where(timer => timer.MemberId == memberId)
            .Select(timer => new RunningTimerResponse
            {
                Id = timer.Id,
                ClientId = timer.ClientId,
                ClientName = timer.Client.Name,
                MemberId = timer.MemberId,
                MemberName = timer.Member.FullName,
                Description = timer.Description,
                StartTimeUtc = timer.StartTimeUtc
            })
            .SingleOrDefaultAsync();
    }

    public async Task<(
    TimeEntryResponse? Entry,
    string? ErrorCode,
    string? Error)> StopAsync(
        int timerId,
        string memberId)
    {
        var timer = await _context.RunningTimers
            .Include(item => item.Client)
            .Include(item => item.Member)
            .SingleOrDefaultAsync(item =>
                item.Id == timerId
                && item.MemberId == memberId);

        if (timer is null)
        {
            return (null, "NotFound",
                "The running timer was not found for your account.");
        }

        if (!timer.Member.IsActive)
        {
            return (null, "Unauthorized",
                "An active account is required.");
        }

        var endTime = DateTimeOffset.UtcNow;

        if (endTime <= timer.StartTimeUtc)
        {
            return (null, "Conflict",
                "The server time is not after the timer's start time. Try again.");
        }

        var entry = new TimeEntry
        {
            ClientId = timer.ClientId,
            MemberId = timer.MemberId,
            Description = timer.Description,
            StartTimeUtc = timer.StartTimeUtc,
            EndTimeUtc = endTime
        };

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        _context.TimeEntries.Add(entry);
        _context.RunningTimers.Remove(timer);

        try
        {
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();

            // Remove the failed changes from this request's context.
            _context.Entry(entry).State = EntityState.Detached;
            _context.Entry(timer).State = EntityState.Detached;

            return (null, "Conflict",
                "The timer was already stopped or changed. Refresh its status.");
        }

        return (new TimeEntryResponse
        {
            Id = entry.Id,
            ClientId = timer.ClientId,
            ClientName = timer.Client.Name,
            MemberId = timer.MemberId,
            MemberName = timer.Member.FullName,
            Description = entry.Description,
            StartTimeUtc = entry.StartTimeUtc,
            EndTimeUtc = entry.EndTimeUtc
        }, null, null);
    }
}