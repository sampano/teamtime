namespace TeamTime.Api.Dtos;

public class ClientReportResponse
{
    public string ClientName { get; set; } = string.Empty;

    public DateTimeOffset? FromUtc { get; set; }

    public DateTimeOffset? ToUtc { get; set; }

    public DateTimeOffset GeneratedAtUtc { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int EntryCount { get; set; }

    public double TotalMinutes { get; set; }

    public double TotalHours => TotalMinutes / 60;

    public List<ClientReportEntryResponse> Entries { get; set; } = new();
}

public class ClientReportEntryResponse
{
    public string MemberName { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartTimeUtc { get; set; }

    public DateTimeOffset EndTimeUtc { get; set; }

    public double DurationMinutes =>
        (EndTimeUtc - StartTimeUtc).TotalMinutes;
}