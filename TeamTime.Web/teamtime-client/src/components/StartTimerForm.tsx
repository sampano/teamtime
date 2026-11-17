import { Play, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import type { Client } from "../api/clients";
import { startTimer } from "../api/timers";
import type { RunningTimerResponse } from "../api/timers";

type StartTimerFormProps = {
  clients: Client[];
  onStarted: (timer: RunningTimerResponse) => void;
  onSessionExpired: () => void;
  onRefreshRequired: () => void;
};

export default function StartTimerForm({
  clients,
  onStarted,
  onSessionExpired,
  onRefreshRequired,
}: StartTimerFormProps) {
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || needsRefresh) {
      return;
    }

    const selectedClientId = Number(clientId);
    const selectedClient = clients.find(
      (client) => client.id === selectedClientId && client.isActive,
    );

    if (!selectedClient) {
      setError("Choose an active client.");
      return;
    }

    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Describe the work you are tracking.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const timer = await startTimer({
        clientId: selectedClient.id,
        description: trimmedDescription,
      });

      onStarted(timer);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        setNeedsRefresh(true);
      }

      setError(
        error instanceof Error ? error.message : "Unable to start the timer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Start tracking"
      aria-busy={isSubmitting}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <label
            htmlFor="timer-client"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Client
          </label>

          <select
            id="timer-client"
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            disabled={isSubmitting || needsRefresh}
            className="h-10 w-full rounded-xl border border-slate-200
                     bg-slate-50/60 px-3.5 text-sm text-slate-800
                     transition-colors focus:border-brand-indigo
                     focus:bg-white focus:outline-none
                     focus:ring-2 focus:ring-brand-indigo/20
                     disabled:opacity-60"
          >
            <option value="">Select a client</option>

            {clients
              .filter((client) => client.isActive)
              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
          </select>
        </div>

        <div className="md:col-span-5">
          <label
            htmlFor="timer-description"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            What are you working on?
          </label>

          <input
            id="timer-description"
            type="text"
            required
            maxLength={500}
            placeholder="Task description..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting || needsRefresh}
            className="h-10 w-full rounded-xl border border-slate-200
                     bg-slate-50/60 px-3.5 text-sm text-slate-800
                     placeholder:text-slate-400
                     transition-colors focus:border-brand-indigo
                     focus:bg-white focus:outline-none
                     focus:ring-2 focus:ring-brand-indigo/20
                     disabled:opacity-60"
          />
        </div>

        <div className="md:col-span-3">
          {needsRefresh ? (
            <button
              type="button"
              onClick={onRefreshRequired}
              className="flex min-h-10 w-full items-center justify-center
                       gap-2 rounded-xl bg-brand-coral px-4 py-2
                       text-sm font-semibold text-white shadow-xs
                       transition-colors hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh status
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || clients.length === 0}
              className="flex h-10 w-full items-center justify-center
                       gap-2 rounded-xl bg-brand-coral px-4
                       text-sm font-semibold text-white shadow-xs
                       transition-all hover:bg-brand-coral-hover
                       active:scale-[0.99]
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo
                       disabled:opacity-60"
            >
              <Play size={16} aria-hidden="true" />
              {isSubmitting ? "Starting…" : "Start timer"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
