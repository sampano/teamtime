import { Check } from "lucide-react";
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

    // Safe: current time is evaluated during form submission.
    // eslint-disable-next-line react-hooks/purity
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
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 " +
    "bg-slate-50/60 px-3.5 text-sm text-slate-800 " +
    "placeholder:text-slate-400 transition-colors " +
    "focus:border-brand-indigo focus:bg-white focus:outline-none " +
    "focus:ring-2 focus:ring-brand-indigo/20";

  const labelClassName = "mb-1.5 block text-xs font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="manual-entry-heading"
      aria-busy={isSubmitting}
      className="space-y-4 rounded-2xl border border-slate-200/80
               bg-white p-5 shadow-xs"
    >
      <div>
        <h2
          id="manual-entry-heading"
          className="font-display text-sm font-bold text-slate-900"
        >
          Add time manually
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          Enter completed work using your local date and time.
        </p>
      </div>

      <fieldset
        disabled={isSubmitting || activeClients.length === 0}
        className="min-w-0 space-y-4 disabled:opacity-60"
      >
        <legend className="sr-only">Time entry details</legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="manual-client" className={labelClassName}>
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

          <div className="min-w-0">
            <label htmlFor="manual-description" className={labelClassName}>
              Work description
            </label>

            <input
              id="manual-description"
              type="text"
              required
              maxLength={500}
              placeholder="e.g. Client review & updates"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="manual-start" className={labelClassName}>
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

          <div className="min-w-0">
            <label htmlFor="manual-end" className={labelClassName}>
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

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center
                     gap-1.5 rounded-xl bg-brand-coral px-5
                     text-sm font-semibold text-white shadow-xs
                     transition-all hover:bg-brand-coral-hover
                     active:scale-[0.99]
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-indigo"
          >
            <Check size={16} aria-hidden="true" />
            <span>{isSubmitting ? "Saving…" : "Save time entry"}</span>
          </button>
        </div>
      </fieldset>

      {activeClients.length === 0 && (
        <p className="text-xs text-slate-500">
          An active client is required to record new time.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
