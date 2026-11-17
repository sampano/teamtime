using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class CreateClientRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
}