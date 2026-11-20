namespace TeamTime.Api.Dtos;

public class ClientReportShareResponse
{
    public int Id { get; set; }

    public int ClientId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset? FromUtc { get; set; }

    public DateTimeOffset? ToUtc { get; set; }

    public DateTimeOffset? ExpiresAtUtc { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }
}