using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Data;
using TeamTime.Api.Dtos;
using TeamTime.Api.Models;
using TeamTime.Api.Security;

namespace TeamTime.Api.Services;

public class ClientReportShareService
{
    private readonly AppDbContext _context;

    public ClientReportShareService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(
        CreateClientReportShareResponse? Response,
        string? ErrorCode,
        string? Error)> CreateAsync(
            int clientId,
            CreateClientReportShareRequest request,
            string currentUserId,
            CancellationToken cancellationToken = default)
    {
        var actorIsAdmin = await IsActiveAdminAsync(
            currentUserId,
            cancellationToken);

        if (!actorIsAdmin)
        {
            return (null, "Forbidden",
                "An active administrator account is required.");
        }

        var clientExists = await _context.Clients
            .AnyAsync(
                client => client.Id == clientId,
                cancellationToken);

        if (!clientExists)
        {
            return (null, "NotFound",
                "The client was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var from = request.FromUtc?.ToUniversalTime();
        var to = request.ToUtc?.ToUniversalTime();
        var expires = request.ExpiresAtUtc?.ToUniversalTime();

        if (from.HasValue
            && to.HasValue
            && to.Value <= from.Value)
        {
            return (null, "Validation",
                "The report end must be after its start.");
        }

        if (expires.HasValue && expires.Value <= now)
        {
            return (null, "Validation",
                "The link expiration must be in the future.");
        }

        var token = WebEncoders.Base64UrlEncode(
            RandomNumberGenerator.GetBytes(32));

        var tokenHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        var share = new ClientReportShare
        {
            ClientId = clientId,
            TokenHash = tokenHash,
            CreatedByMemberId = currentUserId,
            CreatedAtUtc = now,
            FromUtc = from,
            ToUtc = to,
            ExpiresAtUtc = expires
        };

        _context.ClientReportShares.Add(share);

        await _context.SaveChangesAsync(cancellationToken);

        return (new CreateClientReportShareResponse
        {
            Share = new ClientReportShareResponse
            {
                Id = share.Id,
                ClientId = share.ClientId,
                CreatedAtUtc = share.CreatedAtUtc,
                FromUtc = share.FromUtc,
                ToUtc = share.ToUtc,
                ExpiresAtUtc = share.ExpiresAtUtc,
                RevokedAtUtc = share.RevokedAtUtc
            },
            Token = token
        }, null, null);
    }

    public async Task<(
    List<ClientReportShareResponse>? Shares,
    string? ErrorCode,
    string? Error)> GetAllAsync(
        int clientId,
        string currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (!await IsActiveAdminAsync(currentUserId, cancellationToken))
        {
            return (null, "Forbidden",
                "An active administrator account is required.");
        }

        var clientExists = await _context.Clients
            .AnyAsync(
                client => client.Id == clientId,
                cancellationToken);

        if (!clientExists)
        {
            return (null, "NotFound",
                "The client was not found.");
        }

        var shares = await _context.ClientReportShares
            .AsNoTracking()
            .Where(share => share.ClientId == clientId)
            .OrderByDescending(share => share.CreatedAtUtc)
            .ThenByDescending(share => share.Id)
            .Select(share => new ClientReportShareResponse
            {
                Id = share.Id,
                ClientId = share.ClientId,
                CreatedAtUtc = share.CreatedAtUtc,
                FromUtc = share.FromUtc,
                ToUtc = share.ToUtc,
                ExpiresAtUtc = share.ExpiresAtUtc,
                RevokedAtUtc = share.RevokedAtUtc
            })
            .ToListAsync(cancellationToken);

        return (shares, null, null);
    }
    private Task<bool> IsActiveAdminAsync(
    string userId,
    CancellationToken cancellationToken)
    {
        return (
            from user in _context.Users
            join assignment in _context.UserRoles
                on user.Id equals assignment.UserId
            join role in _context.Roles
                on assignment.RoleId equals role.Id
            where user.Id == userId
                && user.IsActive
                && role.Name == AppRoles.Admin
            select user.Id)
            .AnyAsync(cancellationToken);
    }

    public async Task<(string? ErrorCode, string? Error)> RevokeAsync(
    int clientId,
    int shareId,
    string currentUserId,
    CancellationToken cancellationToken = default)
    {
        if (!await IsActiveAdminAsync(currentUserId, cancellationToken))
        {
            return ("Forbidden",
                "An active administrator account is required.");
        }

        var now = DateTimeOffset.UtcNow;

        var updated = await _context.ClientReportShares
            .Where(share =>
                share.Id == shareId
                && share.ClientId == clientId
                && share.RevokedAtUtc == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    share => share.RevokedAtUtc,
                    (DateTimeOffset?)now),
                cancellationToken);

        if (updated == 0)
        {
            var exists = await _context.ClientReportShares
                .AnyAsync(
                    share => share.Id == shareId
                        && share.ClientId == clientId,
                    cancellationToken);

            if (!exists)
            {
                return ("NotFound",
                    "The report link was not found for this client.");
            }
        }

        return (null, null);
    }

    public async Task<ClientReportResponse?> GetPublicReportAsync(
    string token,
    ClientReportQuery request,
    CancellationToken cancellationToken = default)
    {
        // A 32-byte Base64URL token contains 43 characters.
        if (string.IsNullOrWhiteSpace(token)
            || token.Length != 43
            || token.Any(character =>
                !((character >= 'A' && character <= 'Z')
                    || (character >= 'a' && character <= 'z')
                    || (character >= '0' && character <= '9')
                    || character == '-'
                    || character == '_')))
        {
            return null;
        }

        var tokenHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        var now = DateTimeOffset.UtcNow;

        var share = await _context.ClientReportShares
            .AsNoTracking()
            .Where(item =>
                item.TokenHash == tokenHash
                && item.RevokedAtUtc == null
                && (item.ExpiresAtUtc == null
                    || item.ExpiresAtUtc > now))
            .Select(item => new
            {
                item.Id,
                item.ClientId,
                ClientName = item.Client.Name,
                item.FromUtc,
                item.ToUtc
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (share is null)
        {
            return null;
        }

        var query = _context.TimeEntries
            .AsNoTracking()
            .Where(entry => entry.ClientId == share.ClientId);

        if (share.FromUtc.HasValue)
        {
            var from = share.FromUtc.Value;

            query = query.Where(entry => entry.StartTimeUtc >= from);
        }

        if (share.ToUtc.HasValue)
        {
            var to = share.ToUtc.Value;

            query = query.Where(entry => entry.StartTimeUtc < to);
        }

        var totals = await query
            .GroupBy(entry => 1)
            .Select(group => new
            {
                EntryCount = group.Count(),
                TotalMinutes = group.Sum(entry =>
                    (entry.EndTimeUtc.ToUnixTimeMilliseconds()
                        - entry.StartTimeUtc.ToUnixTimeMilliseconds())
                    / 60_000.0)
            })
            .SingleOrDefaultAsync(cancellationToken);

        var skip = checked((request.Page - 1) * request.PageSize);

        var entries = await query
            .OrderByDescending(entry => entry.StartTimeUtc)
            .ThenByDescending(entry => entry.Id)
            .Skip(skip)
            .Take(request.PageSize)
            .Select(entry => new ClientReportEntryResponse
            {
                MemberName = entry.Member.FullName,
                Description = entry.Description,
                StartTimeUtc = entry.StartTimeUtc,
                EndTimeUtc = entry.EndTimeUtc
            })
            .ToListAsync(cancellationToken);

        // Recheck access after querying the report.
        var checkedAt = DateTimeOffset.UtcNow;

        var stillAvailable = await _context.ClientReportShares
            .AnyAsync(
                item => item.Id == share.Id
                    && item.RevokedAtUtc == null
                    && (item.ExpiresAtUtc == null
                        || item.ExpiresAtUtc > checkedAt),
                cancellationToken);

        if (!stillAvailable)
        {
            return null;
        }

        return new ClientReportResponse
        {
            ClientName = share.ClientName,
            FromUtc = share.FromUtc,
            ToUtc = share.ToUtc,
            GeneratedAtUtc = checkedAt,
            Page = request.Page,
            PageSize = request.PageSize,
            EntryCount = totals?.EntryCount ?? 0,
            TotalMinutes = totals?.TotalMinutes ?? 0,
            Entries = entries
        };
    }
}