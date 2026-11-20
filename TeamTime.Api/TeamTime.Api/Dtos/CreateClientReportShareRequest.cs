using System.ComponentModel.DataAnnotations;

namespace TeamTime.Api.Dtos;

public class CreateClientReportShareRequest : IValidatableObject
{
    public DateTimeOffset? FromUtc { get; set; }

    public DateTimeOffset? ToUtc { get; set; }

    public DateTimeOffset? ExpiresAtUtc { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (FromUtc.HasValue
            && ToUtc.HasValue
            && ToUtc.Value <= FromUtc.Value)
        {
            yield return new ValidationResult(
                "The report end must be after its start.",
                new[] { nameof(FromUtc), nameof(ToUtc) });
        }

        if (ExpiresAtUtc.HasValue
            && ExpiresAtUtc.Value <= DateTimeOffset.UtcNow)
        {
            yield return new ValidationResult(
                "The link expiration must be in the future.",
                new[] { nameof(ExpiresAtUtc) });
        }
    }
}