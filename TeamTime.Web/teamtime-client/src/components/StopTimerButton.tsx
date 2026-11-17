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
        <p role="alert" className="text-brand-red">
          {error}
        </p>
      )}

      {needsRefresh ? (
        <button
          type="button"
          onClick={onRefreshRequired}
          className="rounded-lg bg-brand-orange px-5 py-3
                     text-sm font-semibold text-brand-navy
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy"
        >
          Refresh timer status
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStop}
          disabled={isStopping}
          className="rounded-lg bg-brand-red px-5 py-3
                     text-sm font-semibold text-brand-white
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStopping ? "Stopping…" : "Stop timer"}
        </button>
      )}
    </div>
  );
}
