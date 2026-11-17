namespace TeamTime.Api.Models;

public class RunningTimer
{
    public int Id { get; set; }

    public string MemberId { get; set; } = string.Empty;

    public ApplicationUser Member { get; set; } = null!;

    public int ClientId { get; set; }

    public Client Client { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartTimeUtc { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}