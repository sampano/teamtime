using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class ClientReportQuery : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (Page >= 1
            && PageSize is >= 1 and <= 100
            && (long)(Page - 1) * PageSize > int.MaxValue)
        {
            yield return new ValidationResult(
                "The requested page is too large.",
                new[] { nameof(Page) });
        }
    }
}