using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class UpdateMemberRoleRequest
{
    [Required]
    [RegularExpression(
        "^(Admin|Member)$",
        ErrorMessage = "Choose either Admin or Member.")]
    public string Role { get; set; } = string.Empty;
}