using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class UpdateClientStatusRequest
{
    [Required]
    public bool? IsActive { get; set; }
}