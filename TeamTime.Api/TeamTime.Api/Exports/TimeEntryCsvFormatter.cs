using System.Globalization;
using TeamTime.Api.Dtos;

namespace TeamTime.Api.Exports;

public static class TimeEntryCsvFormatter
{
    public const string Header =
        "Entry ID,Client ID,Client,Member ID,Member,Description,"
        + "Start (UTC),End (UTC),Minutes";

    public static string FormatRow(TimeEntryResponse entry)
    {
        var culture = CultureInfo.InvariantCulture;

        string[] fields =
        {
            entry.Id.ToString(culture),
            entry.ClientId.ToString(culture),
            ProtectSpreadsheetText(entry.ClientName),
            ProtectSpreadsheetText(entry.MemberId),
            ProtectSpreadsheetText(entry.MemberName),
            ProtectSpreadsheetText(entry.Description),
            entry.StartTimeUtc.ToUniversalTime().ToString("O", culture),
            entry.EndTimeUtc.ToUniversalTime().ToString("O", culture),
            entry.DurationMinutes.ToString(culture)
        };

        return string.Join(",", fields.Select(Quote));
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }

    private static string ProtectSpreadsheetText(string value)
    {
        var trimmed = value.TrimStart();

        var startsWithControl =
            value.Length > 0
            && value[0] is '\t' or '\r' or '\n';

        var startsWithFormula =
            trimmed.Length > 0
            && "=+-@＝＋－＠".Contains(trimmed[0]);

        if (startsWithControl || startsWithFormula)
        {
            return "\t" + value;
        }

        return value;
    }
}