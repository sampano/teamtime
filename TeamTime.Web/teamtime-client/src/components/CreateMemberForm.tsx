import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { createMember } from "../api/members";
import type { MemberResponse } from "../api/members";

type CreateMemberFormProps = {
  onCreated: (member: MemberResponse) => void;
  onSessionExpired: () => void;
};

export default function CreateMemberForm({
  onCreated,
  onSessionExpired,
}: CreateMemberFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const member = await createMember({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      setFullName("");
      setEmail("");
      setPassword("");
      onCreated(member);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to create member accounts."
          : error instanceof Error
            ? error.message
            : "Unable to create the member account.",
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
      aria-labelledby="create-member-heading"
      aria-busy={isSubmitting}
      className="rounded-xl border border-brand-navy/15 p-6"
    >
      <h2 id="create-member-heading" className="text-lg font-semibold">
        Add team member
      </h2>

      <p className="mt-2">Create an account with the Member role.</p>

      <fieldset
        disabled={isSubmitting}
        className="mt-5 space-y-4 disabled:opacity-60"
      >
        <legend className="sr-only">New member account details</legend>

        <div>
          <label
            htmlFor="member-name"
            className="mb-2 block text-sm font-medium"
          >
            Full name
          </label>

          <input
            id="member-name"
            name="fullName"
            type="text"
            autoComplete="off"
            required
            maxLength={200}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label
            htmlFor="member-email"
            className="mb-2 block text-sm font-medium"
          >
            Email address
          </label>

          <input
            id="member-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            maxLength={256}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label
            htmlFor="member-password"
            className="mb-2 block text-sm font-medium"
          >
            Initial password
          </label>

          <input
            id="member-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            aria-describedby="member-password-help"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
          />

          <p id="member-password-help" className="mt-2">
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>
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
          {isSubmitting ? "Creating…" : "Create member"}
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-brand-red">
          {error}
        </p>
      )}

      <p className="mt-4">
        No invitation email is sent. Share the initial credentials privately
        with the member.
      </p>
    </form>
  );
}
