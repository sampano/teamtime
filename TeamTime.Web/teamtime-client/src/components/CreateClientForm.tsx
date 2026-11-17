import { X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { createClient } from "../api/clients";
import type { Client } from "../api/clients";

type CreateClientFormProps = {
  onCreated: (client: Client) => void;
  onSessionExpired: () => void;
  onCancel?: () => void;
};

export default function CreateClientForm({
  onCreated,
  onSessionExpired,
  onCancel,
}: CreateClientFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Client name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const client = await createClient({
        name: trimmedName,
      });

      setName("");
      onCreated(client);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to create clients."
          : error instanceof Error
            ? error.message
            : "Unable to create the client.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="create-client-heading"
      aria-busy={isSubmitting}
      className="space-y-3 rounded-2xl border
               border-slate-200/90 bg-slate-50/80 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="create-client-heading"
          className="font-display text-sm font-bold text-slate-900"
        >
          Add new client
        </h2>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close add client form"
            className="rounded-lg p-1 text-slate-400
                     hover:bg-slate-200/60 hover:text-slate-600
                     focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
        <div className="min-w-0 sm:col-span-8">
          <label
            htmlFor="client-name"
            className="mb-1 block text-xs font-semibold text-slate-700"
          >
            Client name
          </label>

          <input
            id="client-name"
            name="clientName"
            type="text"
            required
            maxLength={200}
            placeholder="e.g. Apex Innovations"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            className="h-10 w-full rounded-xl border border-slate-200
                     bg-white px-3.5 text-sm text-slate-800
                     placeholder:text-slate-400
                     focus:border-brand-indigo focus:outline-none
                     focus:ring-2 focus:ring-brand-indigo/20
                     disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-10 flex-1 rounded-xl border border-slate-200
                       bg-white px-3 text-xs font-semibold text-slate-600
                       hover:bg-slate-50 focus-visible:outline-2
                       focus-visible:outline-brand-indigo
                       disabled:opacity-60"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 flex-1 rounded-xl bg-brand-coral px-3
                     text-xs font-semibold text-white shadow-xs
                     hover:bg-brand-coral-hover
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save client"}
          </button>
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
