using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class UpdateTimeEntryRequest
{
    [Range(1, int.MaxValue)]
    public int ClientId { get; set; }

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset? StartTimeUtc { get; set; }

    [Required]
    public DateTimeOffset? EndTimeUtc { get; set; }
}