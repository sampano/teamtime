import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import type { Client } from "../api/clients";
import { createTimeEntry } from "../api/timeEntries";
import type { TimeEntryResponse } from "../api/timeEntries";

type CreateTimeEntryFormProps = {
  clients: Client[];
  onCreated: (entry: TimeEntryResponse) => void;
  onSessionExpired: () => void;
};

export default function CreateTimeEntryForm({
  clients,
  onCreated,
  onSessionExpired,
}: CreateTimeEntryFormProps) {
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeClients = clients.filter((client) => client.isActive);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    const selectedClient = activeClients.find(
      (client) => client.id === Number(clientId),
    );

    if (!selectedClient) {
      setError("Choose an active client.");
      return;
    }

    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Describe the work you performed.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      !startTime ||
      !endTime ||
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime())
    ) {
      setError("Enter valid start and end times.");
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setError("End time must be after start time.");
      return;
    }

    if (end.getTime() > Date.now()) {
      setError("The entry cannot end in the future.");
      return;
    }

    setIsSubmitting(true);

    try {
      const entry = await createTimeEntry({
        clientId: selectedClient.id,
        description: trimmedDescription,
        startTimeUtc: start.toISOString(),
        endTimeUtc: end.toISOString(),
      });

      setDescription("");
      setStartTime("");
      setEndTime("");
      onCreated(entry);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the time entry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClassName =
    "w-full rounded-lg border border-brand-navy/30 " +
    "bg-brand-white px-3 py-3 text-sm " +
    "focus-visible:outline-2 focus-visible:outline-brand-navy";

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="manual-entry-heading"
      aria-busy={isSubmitting}
      className="rounded-xl border border-brand-navy/15 p-6"
    >
      <h2 id="manual-entry-heading" className="text-lg font-semibold">
        Add time manually
      </h2>

      <p className="mt-2">
        Enter completed work using your local date and time.
      </p>

      <fieldset
        disabled={isSubmitting || activeClients.length === 0}
        className="mt-5 space-y-4 disabled:opacity-60"
      >
        <legend className="sr-only">Time entry details</legend>

        <div>
          <label
            htmlFor="manual-client"
            className="mb-2 block text-sm font-medium"
          >
            Client
          </label>

          <select
            id="manual-client"
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={fieldClassName}
          >
            <option value="">Select a client</option>

            {activeClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="manual-description"
            className="mb-2 block text-sm font-medium"
          >
            Work description
          </label>

          <textarea
            id="manual-description"
            required
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="manual-start"
              className="mb-2 block text-sm font-medium"
            >
              Start
            </label>

            <input
              id="manual-start"
              type="datetime-local"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor="manual-end"
              className="mb-2 block text-sm font-medium"
            >
              End
            </label>

            <input
              id="manual-end"
              type="datetime-local"
              required
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-brand-orange px-5 py-3
                     text-sm font-semibold text-brand-navy
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving…" : "Save time entry"}
        </button>
      </fieldset>

      {activeClients.length === 0 && (
        <p className="mt-4">An active client is required to record new time.</p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-brand-red">
          {error}
        </p>
      )}
    </form>
  );
}
