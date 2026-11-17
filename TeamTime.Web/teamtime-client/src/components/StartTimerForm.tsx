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
      aria-labelledby="start-timer-heading"
      aria-busy={isSubmitting}
      className="space-y-5"
    >
      <h2 id="start-timer-heading" className="text-lg font-semibold">
        Start tracking
      </h2>

      <div>
        <label
          htmlFor="timer-client"
          className="mb-2 block text-sm font-medium"
        >
          Client
        </label>

        <select
          id="timer-client"
          required
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          disabled={isSubmitting || needsRefresh}
          className="w-full rounded-lg border border-brand-navy/30
                     bg-brand-white px-3 py-3 text-sm
                     focus-visible:outline-2
                     focus-visible:outline-brand-navy
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

      <div>
        <label
          htmlFor="timer-description"
          className="mb-2 block text-sm font-medium"
        >
          What are you working on?
        </label>

        <textarea
          id="timer-description"
          required
          maxLength={500}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={isSubmitting || needsRefresh}
          className="w-full rounded-lg border border-brand-navy/30
                     px-3 py-3 text-sm
                     focus-visible:outline-2
                     focus-visible:outline-brand-navy
                     disabled:opacity-60"
        />
      </div>

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
          type="submit"
          disabled={isSubmitting || clients.length === 0}
          className="rounded-lg bg-brand-orange px-5 py-3
                     text-sm font-semibold text-brand-navy
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Starting…" : "Start timer"}
        </button>
      )}
    </form>
  );
}
