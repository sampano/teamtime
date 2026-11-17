import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { updateClient } from "../api/clients";
import type { Client } from "../api/clients";

type EditClientFormProps = {
  client: Client;
  onSaved: (client: Client) => void;
  onCancel: () => void;
  onSessionExpired: () => void;
};

export default function EditClientForm({
  client,
  onSaved,
  onCancel,
  onSessionExpired,
}: EditClientFormProps) {
  const [name, setName] = useState(client.name);
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
      const updatedClient = await updateClient(client.id, {
        name: trimmedName,
      });

      onSaved(updatedClient);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to edit clients."
          : error instanceof ApiError && error.status === 404
            ? "This client no longer exists. Cancel and refresh the list."
            : error instanceof Error
              ? error.message
              : "Unable to update the client.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`edit-client-heading-${client.id}`}
      onCancel={(event) => {
        event.preventDefault();

        if (!isSubmitting) {
          onCancel();
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)]
               w-[calc(100%-2rem)] max-w-md overflow-y-auto
               rounded-2xl border border-slate-200 bg-white
               p-0 text-slate-800 shadow-2xl
               backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs"
    >
      <div
        className="flex items-center justify-between gap-3
                 border-b border-slate-100 px-5 py-4"
      >
        <h3
          id={`edit-client-heading-${client.id}`}
          className="font-display text-base font-bold text-slate-900"
        >
          Edit client
        </h3>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close edit client"
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
        aria-label={`Edit ${client.name}`}
        aria-busy={isSubmitting}
        className="space-y-4 p-5"
      >
        <div>
          <label
            htmlFor={`client-name-${client.id}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Client name
          </label>

          <input
            id={`client-name-${client.id}`}
            name="clientName"
            type="text"
            required
            maxLength={200}
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            className="h-10 w-full rounded-xl border border-slate-200
                     bg-white px-3 text-sm text-slate-800
                     focus:border-brand-indigo focus:outline-none
                     focus:ring-2 focus:ring-brand-indigo/20
                     disabled:opacity-60"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}

        <div
          className="flex flex-wrap justify-end gap-2
                   border-t border-slate-100 pt-4"
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
