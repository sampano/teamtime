import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;

      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, []);

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
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 " +
    "bg-white px-3 text-sm text-slate-800 " +
    "focus:border-brand-indigo focus:outline-none " +
    "focus:ring-2 focus:ring-brand-indigo/20";

  const labelClassName = "mb-1.5 block text-xs font-semibold text-slate-700";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`edit-entry-heading-${entry.id}`}
      aria-describedby={`edit-entry-description-${entry.id}`}
      onCancel={(event) => {
        event.preventDefault();

        if (!isSubmitting) {
          onCancel();
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)]
               w-[calc(100%-2rem)] max-w-lg overflow-y-auto
               rounded-2xl border border-slate-200 bg-white
               p-0 text-slate-800 shadow-2xl
               backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs"
    >
      <div
        className="flex items-center justify-between gap-3
                 border-b border-slate-100 px-5 py-4"
      >
        <h3
          id={`edit-entry-heading-${entry.id}`}
          className="font-display text-base font-bold text-slate-900"
        >
          Edit time entry
        </h3>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close edit time entry"
          className="rounded-lg p-1.5 text-slate-400
                   hover:bg-slate-100 hover:text-slate-600
                   focus-visible:outline-2
                   focus-visible:outline-brand-indigo
                   disabled:opacity-50"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Edit time entry"
        aria-busy={isSubmitting}
        className="space-y-4 p-5"
      >
        <p
          id={`edit-entry-description-${entry.id}`}
          className="text-xs text-slate-500"
        >
          Dates and times use your local timezone.
        </p>

        <fieldset
          disabled={isSubmitting}
          className="min-w-0 space-y-4 disabled:opacity-60"
        >
          <legend className="sr-only">Editable time entry details</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor={`entry-client-${entry.id}`}
                className={labelClassName}
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
                <option value={entry.clientId}>
                  {entry.clientName} (current)
                </option>

                {otherActiveClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor={`entry-member-${entry.id}`}
                className={labelClassName}
              >
                Team member
              </label>

              <input
                id={`entry-member-${entry.id}`}
                type="text"
                value={entry.memberName}
                readOnly
                className={`${fieldClassName} bg-slate-50 text-slate-500`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`entry-description-${entry.id}`}
              className={labelClassName}
            >
              Work description
            </label>

            <input
              id={`entry-description-${entry.id}`}
              type="text"
              required
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor={`entry-start-${entry.id}`}
                className={labelClassName}
              >
                Start (Local datetime)
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

            <div className="min-w-0">
              <label
                htmlFor={`entry-end-${entry.id}`}
                className={labelClassName}
              >
                End (Local datetime)
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
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}

        <div
          className="flex flex-wrap items-center justify-end
                   gap-2 border-t border-slate-100 pt-4"
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200
                     px-3.5 py-2 text-xs font-semibold text-slate-600
                     hover:bg-slate-50 focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-coral px-4 py-2
                     text-xs font-semibold text-white shadow-xs
                     hover:bg-brand-coral-hover
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
