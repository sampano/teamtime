import { useEffect, useState } from "react";

type ElapsedTimeProps = {
  startTimeUtc: string;
};

function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function ElapsedTime({ startTimeUtc }: ElapsedTimeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    function updateTime() {
      setNow(Date.now());
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        updateTime();
      }
    }

    const intervalId = window.setInterval(updateTime, 1000);

    window.addEventListener("focus", updateTime);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", updateTime);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const start = Date.parse(startTimeUtc);

  if (!Number.isFinite(start)) {
    return <p role="alert">The timer start time is invalid.</p>;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000));

  return (
    <div className="py-3">
      <p>Elapsed time</p>

      <div
        role="timer"
        aria-label="Elapsed time"
        aria-live="off"
        className="mt-2 text-4xl font-semibold
                   tabular-nums text-brand-navy"
      >
        {formatElapsedTime(elapsedSeconds)}
      </div>

      <p className="mt-1 text-brand-navy/70">Hours : Minutes : Seconds</p>
    </div>
  );
}
