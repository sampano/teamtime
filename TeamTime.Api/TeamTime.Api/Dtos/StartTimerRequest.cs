using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class StartTimerRequest
{
    [Range(1, int.MaxValue)]
    public int ClientId { get; set; }

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;
}