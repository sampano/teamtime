import { Check, Lock, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { createMember } from "../api/members";
import type { MemberResponse } from "../api/members";

type CreateMemberFormProps = {
  onCreated: (member: MemberResponse) => void;
  onSessionExpired: () => void;
  onCancel?: () => void;
};

export default function CreateMemberForm({
  onCreated,
  onSessionExpired,
  onCancel,
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
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 " +
    "bg-white px-3.5 text-sm text-slate-800 " +
    "placeholder:text-slate-400 focus:border-brand-indigo " +
    "focus:outline-none focus:ring-2 focus:ring-brand-indigo/20";

  const labelClassName = "mb-1.5 block text-xs font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="create-member-heading"
      aria-busy={isSubmitting}
      className="space-y-4 rounded-2xl border
               border-slate-200/90 bg-slate-50/80 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="create-member-heading"
            className="font-display text-base font-bold text-slate-900"
          >
            Add team member
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Create an account with the Member role.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close add member form"
            className="rounded-lg p-1.5 text-slate-400
                     hover:bg-slate-200/60 hover:text-slate-600
                     focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <fieldset
        disabled={isSubmitting}
        className="min-w-0 space-y-4 disabled:opacity-60"
      >
        <legend className="sr-only">New member account details</legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="member-name" className={labelClassName}>
              Full name
            </label>

            <input
              id="member-name"
              name="fullName"
              type="text"
              autoComplete="off"
              required
              maxLength={200}
              placeholder="e.g. Jordan Lee"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="member-email" className={labelClassName}>
              Email address
            </label>

            <input
              id="member-email"
              name="email"
              type="email"
              autoComplete="off"
              required
              maxLength={256}
              placeholder="jordan@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="member-password" className={labelClassName}>
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
            placeholder="At least 12 characters..."
            aria-describedby="member-password-help"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
          />

          <p
            id="member-password-help"
            className="mt-1.5 text-[11px] leading-relaxed text-slate-500"
          >
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>
        </div>

        <div
          className="flex flex-col justify-between gap-3
                   border-t border-slate-200/80 pt-4
                   sm:flex-row sm:items-center"
        >
          <p className="flex items-start gap-1.5 text-xs text-slate-500">
            <Lock
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-slate-400"
            />
            <span>
              No invitation email is sent. Share the initial credentials
              privately with the member.
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 rounded-xl border border-slate-200
                         bg-white px-3.5 text-xs font-semibold
                         text-slate-600 hover:bg-slate-50
                         focus-visible:outline-2
                         focus-visible:outline-brand-indigo"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center
                       gap-1.5 rounded-xl bg-brand-coral px-4
                       text-xs font-semibold text-white shadow-xs
                       hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo"
            >
              <Check size={14} aria-hidden="true" />
              {isSubmitting ? "Creating…" : "Create member"}
            </button>
          </div>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
