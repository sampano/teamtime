namespace TeamTime.Api.Dtos;

//return useful account details without exposing Identity fields such as PasswordHash or SecurityStamp
public class MemberResponse
{
    public string Id { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public List<string> Roles { get; set; } = new();
}