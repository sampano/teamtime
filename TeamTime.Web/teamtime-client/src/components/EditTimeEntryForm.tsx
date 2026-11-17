import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import type { Client } from "../api/clients";
import { updateTimeEntry } from "../api/timeEntries";
import type { TimeEntryResponse } from "../api/timeEntries";
import { toLocalDateTimeInput } from "../utils/dateTime";

type EditTimeEntryFormProps = {
  entry: TimeEntryResponse;
  clients: Client[];
  onSaved: (entry: TimeEntryResponse) => void;
  onCancel: () => void;
  onSessionExpired: () => void;
};

export default function EditTimeEntryForm({
  entry,
  clients,
  onSaved,
  onCancel,
  onSessionExpired,
}: EditTimeEntryFormProps) {
  const initialStart = toLocalDateTimeInput(entry.startTimeUtc);
  const initialEnd = toLocalDateTimeInput(entry.endTimeUtc);

  const [clientId, setClientId] = useState(String(entry.clientId));
  const [description, setDescription] = useState(entry.description);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherActiveClients = clients.filter(
    (client) => client.isActive && client.id !== entry.clientId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    const selectedId = Number(clientId);
    const allowedClient =
      selectedId === entry.clientId ||
      otherActiveClients.some((client) => client.id === selectedId);

    if (!allowedClient) {
      setError("Keep the current client or choose an active client.");
      return;
    }

    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Describe the work performed.");
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
      const updatedEntry = await updateTimeEntry(entry.id, {
        clientId: selectedId,
        description: trimmedDescription,
        startTimeUtc:
          startTime === initialStart ? entry.startTimeUtc : start.toISOString(),
        endTimeUtc:
          endTime === initialEnd ? entry.endTimeUtc : end.toISOString(),
      });

      onSaved(updatedEntry);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to edit this entry."
          : error instanceof ApiError && error.status === 404
            ? "This entry no longer exists. Cancel and refresh the list."
            : error instanceof Error
              ? error.message
              : "Unable to update the time entry.",
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
      aria-labelledby={`edit-entry-heading-${entry.id}`}
      aria-busy={isSubmitting}
      className="rounded-xl border border-brand-navy/15 p-6"
    >
      <h3
        id={`edit-entry-heading-${entry.id}`}
        className="text-lg font-semibold"
      >
        Edit time entry
      </h3>

      <p className="mt-2">Recorded by {entry.memberName}</p>
      <p className="mt-1">Dates and times use your local timezone.</p>

      <fieldset
        disabled={isSubmitting}
        className="mt-5 space-y-4 disabled:opacity-60"
      >
        <legend className="sr-only">Editable time entry details</legend>

        <div>
          <label
            htmlFor={`entry-client-${entry.id}`}
            className="mb-2 block text-sm font-medium"
          >
            Client
          </label>

          <select
            id={`entry-client-${entry.id}`}
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={fieldClassName}
          >
            <option value={entry.clientId}>{entry.clientName} (current)</option>

            {otherActiveClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`entry-description-${entry.id}`}
            className="mb-2 block text-sm font-medium"
          >
            Work description
          </label>

          <textarea
            id={`entry-description-${entry.id}`}
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
              htmlFor={`entry-start-${entry.id}`}
              className="mb-2 block text-sm font-medium"
            >
              Start
            </label>

            <input
              id={`entry-start-${entry.id}`}
              type="datetime-local"
              step="0.001"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor={`entry-end-${entry.id}`}
              className="mb-2 block text-sm font-medium"
            >
              End
            </label>

            <input
              id={`entry-end-${entry.id}`}
              type="datetime-local"
              step="0.001"
              required
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-brand-red">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-orange px-5 py-3
                     text-sm font-semibold text-brand-navy
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-brand-navy/30
                     px-5 py-3 text-sm
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
