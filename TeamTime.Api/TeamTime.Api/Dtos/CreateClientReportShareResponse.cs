namespace TeamTime.Api.Dtos;

public class CreateClientReportShareResponse
{
    public ClientReportShareResponse Share { get; set; } = new();

    public string Token { get; set; } = string.Empty;
}