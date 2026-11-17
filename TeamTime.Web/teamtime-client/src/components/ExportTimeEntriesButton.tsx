import { Download, LoaderCircle } from "lucide-react";
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
    <div className="shrink-0 space-y-2 self-start">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        aria-busy={isExporting}
        className="inline-flex h-9 items-center justify-center
                 gap-1.5 whitespace-nowrap rounded-xl border
                 border-slate-200 bg-white px-3.5
                 text-xs font-semibold text-slate-700
                 transition-colors hover:bg-slate-50
                 focus-visible:outline-2
                 focus-visible:outline-offset-2
                 focus-visible:outline-brand-indigo
                 disabled:opacity-60"
      >
        {isExporting ? (
          <LoaderCircle
            size={14}
            aria-hidden="true"
            className="animate-spin text-slate-500"
          />
        ) : (
          <Download size={14} aria-hidden="true" className="text-slate-500" />
        )}

        <span>{isExporting ? "Exporting…" : "Export CSV"}</span>
      </button>

      {error && (
        <p role="alert" className="max-w-xs text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
