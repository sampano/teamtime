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
    <section aria-labelledby="time-tracking-heading">
      <h1 id="time-tracking-heading" className="text-2xl font-semibold">
        Time tracking
      </h1>

      <p className="mt-2">Track your work for each client.</p>
      <p role="status" className="mt-4">
        {notice}
      </p>

      <div className="mt-6 rounded-xl border border-brand-navy/15 p-6">
        {state.status === "loading" && (
          <p role="status">Loading time tracking…</p>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <p role="alert" className="text-brand-red">
              {state.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="rounded-lg bg-brand-orange px-4 py-3
                         text-sm font-semibold text-brand-navy
                         focus-visible:outline-2
                         focus-visible:outline-offset-2
                         focus-visible:outline-brand-navy"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <div className="space-y-4">
            {state.timer ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Your timer is running</h2>

                <p>Client: {state.timer.clientName}</p>
                <p>{state.timer.description}</p>

                <p>
                  Started: {new Date(state.timer.startTimeUtc).toLocaleString()}{" "}
                  (your local time)
                </p>
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
              <p>No timer is currently running.</p>
            )}

            <p>
              {state.clients.length} active clients available for new timers.
            </p>

            {state.clients.length === 0 && (
              <p>
                An administrator must add or restore a client before you can
                start a new timer.
              </p>
            )}
          </div>
        )}
      </div>
      {state.status === "ready" && (
        <div className="mt-8">
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
        </div>
      )}
      <div className="mt-10">
        <TimeEntryList
          currentUser={currentUser}
          refreshVersion={entryListVersion}
          onSessionExpired={onSessionExpired}
        />
      </div>
    </section>
  );
}
