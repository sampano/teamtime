namespace TeamTime.Api.Dtos;

public class TimeEntrySummaryResponse
{
    public int EntryCount { get; set; }

    public double TotalMinutes { get; set; }

    public double TotalHours => TotalMinutes / 60;

    public List<ClientTimeSummaryResponse> ByClient { get; set; } = new();

    public List<MemberTimeSummaryResponse> ByMember { get; set; } = new();
}

public class ClientTimeSummaryResponse
{
    public int ClientId { get; set; }

    public string ClientName { get; set; } = string.Empty;

    public int EntryCount { get; set; }

    public double TotalMinutes { get; set; }

    public double TotalHours => TotalMinutes / 60;
}

public class MemberTimeSummaryResponse
{
    public string MemberId { get; set; } = string.Empty;

    public string MemberName { get; set; } = string.Empty;

    public int EntryCount { get; set; }

    public double TotalMinutes { get; set; }

    public double TotalHours => TotalMinutes / 60;
}