import { useEffect, useRef, useState } from "react";
import { KeyRound, X } from "lucide-react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { resetMemberPassword } from "../api/members";
import type { MemberResponse } from "../api/members";

type ResetMemberPasswordFormProps = {
  member: MemberResponse;
  onReset: () => void;
  onCancel: () => void;
  onSessionExpired: () => void;
};

export default function ResetMemberPasswordForm({
  member,
  onReset,
  onCancel,
  onSessionExpired,
}: ResetMemberPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    setError("");

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetMemberPassword(member.id, {
        newPassword,
        confirmPassword,
      });

      setNewPassword("");
      setConfirmPassword("");
      onReset();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to reset member passwords."
          : error instanceof ApiError && error.status === 404
            ? "This account no longer exists. Cancel and refresh the team page."
            : error instanceof Error
              ? error.message
              : "Unable to reset the password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "h-10 w-full rounded-xl border border-slate-200 " +
    "bg-white px-3.5 text-sm text-slate-800 " +
    "focus:border-brand-indigo focus:outline-none " +
    "focus:ring-2 focus:ring-brand-indigo/20 disabled:opacity-60";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`reset-heading-${member.id}`}
      aria-describedby={`reset-description-${member.id}`}
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
        className="flex items-start justify-between gap-3
                 border-b border-slate-100 px-5 py-4"
      >
        <div>
          <h3
            id={`reset-heading-${member.id}`}
            className="font-display text-base font-bold text-slate-900"
          >
            Reset member password
          </h3>

          <p
            id={`reset-description-${member.id}`}
            className="mt-1 break-words text-xs text-slate-500"
          >
            Set a new password for {member.fullName} ({member.email}).
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close reset password"
          className="shrink-0 rounded-lg p-1.5 text-slate-400
                   hover:bg-slate-100 hover:text-slate-600
                   focus-visible:outline-2
                   focus-visible:outline-brand-indigo
                   disabled:opacity-60"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label={`Reset password for ${member.fullName}`}
        aria-busy={isSubmitting}
        className="space-y-4 p-5"
      >
        <div>
          <label
            htmlFor={`reset-password-${member.id}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            New password
          </label>

          <input
            id={`reset-password-${member.id}`}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            aria-describedby={`reset-requirements-${member.id}`}
            disabled={isSubmitting}
            className={inputClassName}
          />

          <p
            id={`reset-requirements-${member.id}`}
            className="mt-1.5 text-[11px] leading-relaxed text-slate-500"
          >
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>
        </div>

        <div>
          <label
            htmlFor={`reset-confirm-password-${member.id}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Confirm new password
          </label>

          <input
            id={`reset-confirm-password-${member.id}`}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />
        </div>

        <p
          className="rounded-xl border border-amber-200
                   bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          Share the replacement password privately with the member. No email is
          sent.
        </p>

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
                     bg-white px-3.5 py-2 text-xs font-semibold
                     text-slate-600 hover:bg-slate-50
                     focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center
                     gap-1.5 rounded-xl bg-brand-coral px-4 py-2
                     text-xs font-semibold text-white shadow-xs
                     hover:bg-brand-coral-hover
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
          >
            <KeyRound size={14} aria-hidden="true" />
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
