using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class UpdateMemberStatusRequest
{
    [Required]
    public bool? IsActive { get; set; }
}