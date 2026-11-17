import { RefreshCw, Square } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../api/http";
import { stopTimer } from "../api/timers";
import type { TimeEntryResponse } from "../api/timeEntries";

type StopTimerButtonProps = {
  timerId: number;
  onStopped: (entry: TimeEntryResponse) => void;
  onSessionExpired: () => void;
  onRefreshRequired: () => void;
};

export default function StopTimerButton({
  timerId,
  onStopped,
  onSessionExpired,
  onRefreshRequired,
}: StopTimerButtonProps) {
  const [isStopping, setIsStopping] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState("");

  async function handleStop() {
    if (isStopping || needsRefresh) {
      return;
    }

    setIsStopping(true);
    setError("");

    try {
      const entry = await stopTimer(timerId);
      onStopped(entry);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      if (
        !(error instanceof ApiError) ||
        error.status === 404 ||
        error.status === 409 ||
        error.status >= 500
      ) {
        setNeedsRefresh(true);

        setError(
          "The timer may have stopped or changed. Refresh its status before continuing.",
        );

        return;
      }

      setError(
        error instanceof Error ? error.message : "Unable to stop the timer.",
      );
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="max-w-sm text-xs text-rose-600">
          {error}
        </p>
      )}

      {needsRefresh ? (
        <button
          type="button"
          onClick={onRefreshRequired}
          className="inline-flex min-h-10 items-center justify-center
                   gap-2 rounded-xl bg-brand-coral px-4 py-2
                   text-sm font-semibold text-white shadow-xs
                   transition-colors hover:bg-brand-coral-hover
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-indigo"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh timer status
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStop}
          disabled={isStopping}
          className="inline-flex h-10 items-center justify-center
                   gap-2 rounded-xl bg-rose-600 px-4
                   text-sm font-semibold text-white shadow-xs
                   transition-all hover:bg-rose-700
                   active:scale-[0.99]
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-rose-600
                   disabled:opacity-60"
        >
          <Square size={16} aria-hidden="true" />
          {isStopping ? "Stopping…" : "Stop timer"}
        </button>
      )}
    </div>
  );
}
