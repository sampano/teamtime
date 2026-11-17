import { useEffect, useState } from "react";
import { ApiError } from "../api/http";
import { getClients } from "../api/clients";
import type { Client } from "../api/clients";
import { getCurrentTimer } from "../api/timers";
import type { RunningTimerResponse } from "../api/timers";
import StartTimerForm from "../components/StartTimerForm";
import StopTimerButton from "../components/StopTimerButton";
import ElapsedTime from "../components/ElapsedTime";
import TimeEntryList from "../components/TimeEntryList";
import CreateTimeEntryForm from "../components/CreateTimeEntryForm";
import type { CurrentUser } from "../api/auth";

type TimeTrackingPageProps = {
  currentUser: CurrentUser;
  onSessionExpired: () => void;
};

type PageState =
  | { status: "loading" }
  | {
      status: "ready";
      clients: Client[];
      timer: RunningTimerResponse | null;
    }
  | { status: "error"; message: string };

export default function TimeTrackingPage({
  currentUser,
  onSessionExpired,
}: TimeTrackingPageProps) {
  const [state, setState] = useState<PageState>({
    status: "loading",
  });

  const [entryListVersion, setEntryListVersion] = useState(0);

  const [notice, setNotice] = useState("");

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const [clients, timer] = await Promise.all([
          getClients(),
          getCurrentTimer(),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          status: "ready",
          clients: clients.filter((client) => client.isActive),
          timer,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired();
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load time tracking.",
        });
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [attempt, onSessionExpired]);

  return (
    <section aria-labelledby="time-tracking-heading" className="space-y-6">
      <div>
        <h1
          id="time-tracking-heading"
          className="font-display text-xl font-bold
                   tracking-tight text-slate-900"
        >
          Time tracking
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">
          Track your work for each client.
        </p>
      </div>

      <p
        role="status"
        className={
          notice
            ? "rounded-xl border border-emerald-200 bg-emerald-50 " +
              "px-4 py-3 text-sm text-emerald-800"
            : "sr-only"
        }
      >
        {notice}
      </p>

      <section
        aria-labelledby="tracker-heading"
        className="space-y-4 rounded-2xl border
                 border-slate-200/80 bg-white p-5 shadow-xs"
      >
        <div
          className="flex flex-col gap-3 sm:flex-row
                   sm:items-center sm:justify-between"
        >
          <h2
            id="tracker-heading"
            className="font-display text-sm font-bold text-slate-900"
          >
            {state.status === "ready" && state.timer
              ? "Currently tracking"
              : "Start tracking"}
          </h2>

          {state.status === "ready" && (
            <span
              className="inline-flex items-center gap-1.5 self-start
                       rounded-full border border-emerald-200/80
                       bg-emerald-50 px-2.5 py-1 text-xs
                       font-medium text-emerald-700"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              />
              {state.clients.length} active clients available for new timers
            </span>
          )}
        </div>

        {state.status === "loading" && (
          <p role="status" className="text-sm text-slate-500">
            Loading time tracking…
          </p>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <p role="alert" className="text-sm text-rose-600">
              {state.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="rounded-xl bg-brand-coral px-4 py-2.5
                       text-sm font-semibold text-white
                       transition-colors hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <>
            {state.timer ? (
              <div
                className="grid gap-5 rounded-xl border
                         border-indigo-200/70 bg-indigo-50/40
                         p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <p className="text-sm font-semibold text-brand-indigo">
                    {state.timer.clientName}
                  </p>

                  <p className="break-words text-sm text-slate-700">
                    {state.timer.description}
                  </p>

                  <p className="text-xs text-slate-500">
                    Started:{" "}
                    {new Date(state.timer.startTimeUtc).toLocaleString()} (your
                    local time)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <ElapsedTime
                    key={`elapsed-${state.timer.id}`}
                    startTimeUtc={state.timer.startTimeUtc}
                  />

                  <StopTimerButton
                    key={`stop-${state.timer.id}`}
                    timerId={state.timer.id}
                    onSessionExpired={onSessionExpired}
                    onStopped={(entry) => {
                      setNotice(
                        `Saved ${entry.durationMinutes.toFixed(2)} minutes for ${entry.clientName}.`,
                      );

                      setEntryListVersion((version) => version + 1);
                      setState({ status: "loading" });
                      setAttempt((value) => value + 1);
                    }}
                    onRefreshRequired={() => {
                      setNotice("");
                      setState({ status: "loading" });
                      setAttempt((value) => value + 1);
                    }}
                  />
                </div>
              </div>
            ) : state.clients.length > 0 ? (
              <StartTimerForm
                clients={state.clients}
                onSessionExpired={onSessionExpired}
                onStarted={(timer) => {
                  setNotice("");
                  setState((current) =>
                    current.status === "ready"
                      ? { ...current, timer }
                      : current,
                  );
                }}
                onRefreshRequired={() => {
                  setState({ status: "loading" });
                  setAttempt((value) => value + 1);
                }}
              />
            ) : (
              <p className="text-sm text-slate-500">
                No timer is running. An administrator must add or restore a
                client before you can start a new timer.
              </p>
            )}
          </>
        )}
      </section>

      {state.status === "ready" && (
        <CreateTimeEntryForm
          clients={state.clients}
          onSessionExpired={onSessionExpired}
          onCreated={(entry) => {
            setNotice(
              `Saved ${entry.durationMinutes.toFixed(2)} minutes for ${entry.clientName}.`,
            );

            setEntryListVersion((version) => version + 1);
          }}
        />
      )}

      <TimeEntryList
        currentUser={currentUser}
        refreshVersion={entryListVersion}
        onSessionExpired={onSessionExpired}
      />
    </section>
  );
}
