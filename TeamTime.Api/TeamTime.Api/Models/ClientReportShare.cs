namespace TeamTime.Api.Models;

public class ClientReportShare
{
    public int Id { get; set; }

    public int ClientId { get; set; }

    public Client Client { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;

    public string CreatedByMemberId { get; set; } = string.Empty;

    public ApplicationUser CreatedByMember { get; set; } = null!;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset? FromUtc { get; set; }

    public DateTimeOffset? ToUtc { get; set; }

    public DateTimeOffset? ExpiresAtUtc { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }
}