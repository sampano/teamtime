namespace TeamTime.Api.Dtos;

public class RunningTimerResponse
{
    public int Id { get; set; }

    public int ClientId { get; set; }

    public string ClientName { get; set; } = string.Empty;

    public string MemberId { get; set; } = string.Empty;

    public string MemberName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartTimeUtc { get; set; }
}