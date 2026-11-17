using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Data;
using TeamTime.Api.Dtos;
using TeamTime.Api.Models;

namespace TeamTime.Api.Services;

public class TimeEntryService
{
    private readonly AppDbContext _context;

    public TimeEntryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(TimeEntryResponse? Entry, string? Error)>
        CreateAsync(
            CreateTimeEntryRequest request,
            string memberId)
    {
        var description = request.Description?.Trim();

        if (string.IsNullOrWhiteSpace(description)
            || description.Length > 500)
        {
            return (null,
                "A work description of up to 500 characters is required.");
        }

        if (!request.StartTimeUtc.HasValue
            || !request.EndTimeUtc.HasValue)
        {
            return (null, "Start and end times are required.");
        }

        var start = request.StartTimeUtc.Value.ToUniversalTime();
        var end = request.EndTimeUtc.Value.ToUniversalTime();

        if (end <= start)
        {
            return (null, "End time must be after start time.");
        }

        if (end > DateTimeOffset.UtcNow)
        {
            return (null, "The entry cannot end in the future.");
        }

        var member = await _context.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Id == memberId);

        if (member is null || !member.IsActive)
        {
            return (null, "An active member account is required.");
        }

        var client = await _context.Clients
            .AsNoTracking()
            .SingleOrDefaultAsync(client =>
                client.Id == request.ClientId);

        if (client is null)
        {
            return (null, "The client was not found.");
        }

        if (!client.IsActive)
        {
            return (null,
                "New time entries cannot be recorded for an archived client.");
        }

        var entry = new TimeEntry
        {
            ClientId = client.Id,
            MemberId = member.Id,
            Description = description,
            StartTimeUtc = start,
            EndTimeUtc = end
        };

        _context.TimeEntries.Add(entry);

        await _context.SaveChangesAsync();

        var response = new TimeEntryResponse
        {
            Id = entry.Id,
            ClientId = client.Id,
            ClientName = client.Name,
            MemberId = member.Id,
            MemberName = member.FullName,
            Description = entry.Description,
            StartTimeUtc = entry.StartTimeUtc,
            EndTimeUtc = entry.EndTimeUtc
        };

        return (response, null);
    }

    public async Task<List<TimeEntryResponse>> GetAllAsync(
    TimeEntryQuery filters)
    {
        var query = BuildFilteredQuery(filters);

        var skip = checked((filters.Page - 1) * filters.PageSize);

        return await query
            .OrderByDescending(entry => entry.StartTimeUtc)
            .ThenByDescending(entry => entry.Id)
            .Skip(skip)
            .Take(filters.PageSize)
            .Select(entry => new TimeEntryResponse
            {
                Id = entry.Id,
                ClientId = entry.ClientId,
                ClientName = entry.Client.Name,
                MemberId = entry.MemberId,
                MemberName = entry.Member.FullName,
                Description = entry.Description,
                StartTimeUtc = entry.StartTimeUtc,
                EndTimeUtc = entry.EndTimeUtc
            })
            .ToListAsync();
    }

    public async Task<TimeEntryResponse?> GetByIdAsync(int id)
    {
        return await _context.TimeEntries
            .AsNoTracking()
            .Where(entry => entry.Id == id)
            .Select(entry => new TimeEntryResponse
            {
                Id = entry.Id,
                ClientId = entry.ClientId,
                ClientName = entry.Client.Name,
                MemberId = entry.MemberId,
                MemberName = entry.Member.FullName,
                Description = entry.Description,
                StartTimeUtc = entry.StartTimeUtc,
                EndTimeUtc = entry.EndTimeUtc
            })
            .SingleOrDefaultAsync();
    }

    public async Task<(TimeEntryResponse? Entry, string? ErrorCode,string? Error)> UpdateAsync(
        int id,
        UpdateTimeEntryRequest request,
        string currentUserId,
        bool isAdmin)
    {
        var entry = await _context.TimeEntries
            .Include(item => item.Member)
            .SingleOrDefaultAsync(item => item.Id == id);

        if (entry is null)
        {
            return (null, "NotFound", "The time entry was not found.");
        }

        if (entry.MemberId != currentUserId && !isAdmin)
        {
            return (null, "Forbidden",
                "You can only edit your own time entries.");
        }

        var description = request.Description?.Trim();

        if (string.IsNullOrWhiteSpace(description)
            || description.Length > 500)
        {
            return (null, "Validation",
                "A work description of up to 500 characters is required.");
        }

        if (!request.StartTimeUtc.HasValue
            || !request.EndTimeUtc.HasValue)
        {
            return (null, "Validation",
                "Start and end times are required.");
        }

        var start = request.StartTimeUtc.Value.ToUniversalTime();
        var end = request.EndTimeUtc.Value.ToUniversalTime();

        if (end <= start)
        {
            return (null, "Validation",
                "End time must be after start time.");
        }

        if (end > DateTimeOffset.UtcNow)
        {
            return (null, "Validation",
                "The entry cannot end in the future.");
        }

        var client = await _context.Clients
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.ClientId);

        if (client is null)
        {
            return (null, "Validation", "The client was not found.");
        }

        if (client.Id != entry.ClientId && !client.IsActive)
        {
            return (null, "Validation",
                "You cannot move an entry to an archived client.");
        }

        entry.ClientId = client.Id;
        entry.Description = description;
        entry.StartTimeUtc = start;
        entry.EndTimeUtc = end;

        await _context.SaveChangesAsync();

        return (new TimeEntryResponse
        {
            Id = entry.Id,
            ClientId = client.Id,
            ClientName = client.Name,
            MemberId = entry.MemberId,
            MemberName = entry.Member.FullName,
            Description = entry.Description,
            StartTimeUtc = entry.StartTimeUtc,
            EndTimeUtc = entry.EndTimeUtc
        }, null, null);
    }

    private IQueryable<TimeEntry> BuildFilteredQuery(
    TimeEntryQuery filters)
    {
        var query = _context.TimeEntries.AsNoTracking();

        if (filters.ClientId.HasValue)
        {
            query = query.Where(entry =>
                entry.ClientId == filters.ClientId.Value);
        }

        if (filters.MemberId is not null)
        {
            query = query.Where(entry =>
                entry.MemberId == filters.MemberId);
        }

        if (filters.FromUtc.HasValue)
        {
            var from = filters.FromUtc.Value.ToUniversalTime();

            query = query.Where(entry =>
                entry.StartTimeUtc >= from);
        }

        if (filters.ToUtc.HasValue)
        {
            var to = filters.ToUtc.Value.ToUniversalTime();

            query = query.Where(entry =>
                entry.StartTimeUtc < to);
        }

        return query;
    }

    public async Task<TimeEntrySummaryResponse> GetSummaryAsync(
    TimeEntryQuery filters)
    {
        var groups = await BuildFilteredQuery(filters)
            .GroupBy(entry => new
            {
                entry.ClientId,
                ClientName = entry.Client.Name,
                entry.MemberId,
                MemberName = entry.Member.FullName
            })
            .Select(group => new
            {
                group.Key.ClientId,
                group.Key.ClientName,
                group.Key.MemberId,
                group.Key.MemberName,
                EntryCount = group.Count(),
                TotalMinutes = group.Sum(entry =>
                    (entry.EndTimeUtc.ToUnixTimeMilliseconds()
                        - entry.StartTimeUtc.ToUnixTimeMilliseconds())
                    / 60_000.0)
            })
            .ToListAsync();

        return new TimeEntrySummaryResponse
        {
            EntryCount = groups.Sum(group => group.EntryCount),

            TotalMinutes = groups.Sum(group => group.TotalMinutes),

            ByClient = groups
                .GroupBy(group => new
                {
                    group.ClientId,
                    group.ClientName
                })
                .Select(client => new ClientTimeSummaryResponse
                {
                    ClientId = client.Key.ClientId,
                    ClientName = client.Key.ClientName,
                    EntryCount = client.Sum(group => group.EntryCount),
                    TotalMinutes = client.Sum(group => group.TotalMinutes)
                })
                .OrderByDescending(client => client.TotalMinutes)
                .ThenBy(client => client.ClientId)
                .ToList(),

            ByMember = groups
                .GroupBy(group => new
                {
                    group.MemberId,
                    group.MemberName
                })
                .Select(member => new MemberTimeSummaryResponse
                {
                    MemberId = member.Key.MemberId,
                    MemberName = member.Key.MemberName,
                    EntryCount = member.Sum(group => group.EntryCount),
                    TotalMinutes = member.Sum(group => group.TotalMinutes)
                })
                .OrderByDescending(member => member.TotalMinutes)
                .ThenBy(member => member.MemberId)
                .ToList()
        };
    }

    public IAsyncEnumerable<TimeEntryResponse> GetForExport(
    TimeEntryQuery filters)
    {
        return BuildFilteredQuery(filters)
            .OrderByDescending(entry => entry.StartTimeUtc)
            .ThenByDescending(entry => entry.Id)
            .Select(entry => new TimeEntryResponse
            {
                Id = entry.Id,
                ClientId = entry.ClientId,
                ClientName = entry.Client.Name,
                MemberId = entry.MemberId,
                MemberName = entry.Member.FullName,
                Description = entry.Description,
                StartTimeUtc = entry.StartTimeUtc,
                EndTimeUtc = entry.EndTimeUtc
            })
            .AsAsyncEnumerable();
    }


}