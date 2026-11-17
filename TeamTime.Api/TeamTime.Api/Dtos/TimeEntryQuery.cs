using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

//checks rules involving multiple properties, such as the date range
public class TimeEntryQuery : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 50;

    [Range(1, int.MaxValue)]
    public int? ClientId { get; set; }

    [StringLength(450, MinimumLength = 1)]
    public string? MemberId { get; set; }

    public DateTimeOffset? FromUtc { get; set; }

    public DateTimeOffset? ToUtc { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (MemberId is not null
            && string.IsNullOrWhiteSpace(MemberId))
        {
            yield return new ValidationResult(
                "Member ID cannot be blank.",
                new[] { nameof(MemberId) });
        }

        if (FromUtc.HasValue
            && ToUtc.HasValue
            && ToUtc.Value <= FromUtc.Value)
        {
            yield return new ValidationResult(
                "ToUtc must be after FromUtc.",
                new[] { nameof(FromUtc), nameof(ToUtc) });
        }

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