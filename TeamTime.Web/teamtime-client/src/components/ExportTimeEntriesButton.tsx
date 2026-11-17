import { useState } from "react";
import type { TimeEntryQuery } from "../api/timeEntries";

type ExportTimeEntriesButtonProps = {
  filters: Omit<TimeEntryQuery, "page" | "pageSize">;
  onSessionExpired: () => void;
};

export default function ExportTimeEntriesButton({
  filters,
  onSessionExpired,
}: ExportTimeEntriesButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    if (isExporting) {
      return;
    }

    setError("");
    setIsExporting(true);

    try {
      const parameters = new URLSearchParams();

      if (filters.clientId !== undefined) {
        parameters.set("clientId", String(filters.clientId));
      }

      if (filters.memberId !== undefined) {
        parameters.set("memberId", filters.memberId);
      }

      if (filters.fromUtc !== undefined) {
        parameters.set("fromUtc", filters.fromUtc);
      }

      if (filters.toUtc !== undefined) {
        parameters.set("toUtc", filters.toUtc);
      }

      const queryString = parameters.toString();

      const response = await fetch(
        `/api/time-entries/export${queryString ? `?${queryString}` : ""}`,
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "text/csv",
          },
        },
      );

      if (response.status === 401) {
        onSessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "You do not have permission to export time entries."
            : `Unable to export time entries (${response.status}).`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `teamtime-entries-${new Date().toISOString().slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to export time entries.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="rounded-lg border border-brand-navy/30
                   px-4 py-2 text-sm font-medium text-brand-navy
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy
                   disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? "Exporting…" : "Export CSV"}
      </button>

      {error && (
        <p role="alert" className="text-brand-red">
          {error}
        </p>
      )}
    </div>
  );
}
