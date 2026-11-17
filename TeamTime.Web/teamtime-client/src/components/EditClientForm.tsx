import { useState } from "react";
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
    <form
      onSubmit={handleSubmit}
      aria-label={`Edit ${client.name}`}
      aria-busy={isSubmitting}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor={`client-name-${client.id}`}
          className="mb-2 block text-sm font-medium"
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

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-orange px-4 py-2
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
                     px-4 py-2 text-sm font-medium text-brand-navy
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
