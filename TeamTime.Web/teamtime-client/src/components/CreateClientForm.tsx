import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { createClient } from "../api/clients";
import type { Client } from "../api/clients";

type CreateClientFormProps = {
  onCreated: (client: Client) => void;
  onSessionExpired: () => void;
};

export default function CreateClientForm({
  onCreated,
  onSessionExpired,
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
      className="rounded-xl border border-brand-navy/15 p-6"
    >
      <h2 id="create-client-heading" className="text-lg font-semibold">
        Add client
      </h2>

      <div className="mt-4">
        <label htmlFor="client-name" className="mb-2 block text-sm font-medium">
          Client name
        </label>

        <input
          id="client-name"
          name="clientName"
          type="text"
          required
          maxLength={200}
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
        <p role="alert" className="mt-3 text-brand-red">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-lg bg-brand-orange px-5 py-3
                   text-sm font-semibold text-brand-navy
                   hover:bg-brand-orange/90
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy
                   disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Adding…" : "Add client"}
      </button>
    </form>
  );
}
