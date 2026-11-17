using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class ResetMemberPasswordRequest
{
    [Required]
    [StringLength(128, MinimumLength = 12)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(
        nameof(NewPassword),
        ErrorMessage = "The new passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}