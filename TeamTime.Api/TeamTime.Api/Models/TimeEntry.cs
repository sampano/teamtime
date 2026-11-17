namespace TeamTime.Api.Models;

public class TimeEntry
{
    public int Id { get; set; }

    public int ClientId { get; set; }

    public Client Client { get; set; } = null!;

    public string MemberId { get; set; } = string.Empty;

    public ApplicationUser Member { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartTimeUtc { get; set; }

    public DateTimeOffset EndTimeUtc { get; set; }
}