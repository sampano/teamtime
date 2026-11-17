import { useState } from "react";
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
    "w-full rounded-lg border border-brand-navy/30 px-3 py-3 " +
    "text-sm focus-visible:outline-2 " +
    "focus-visible:outline-brand-navy disabled:opacity-60";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Reset password for ${member.fullName}`}
      aria-busy={isSubmitting}
      className="mt-4 space-y-4 border-t border-brand-navy/15 pt-4"
    >
      <h3 className="font-semibold">Reset password</h3>

      <p>
        Set a replacement password for {member.fullName} and share it privately
        with them.
      </p>

      <div>
        <label
          htmlFor={`reset-password-${member.id}`}
          className="mb-2 block text-sm font-medium"
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

        <p id={`reset-requirements-${member.id}`} className="mt-2">
          Use at least 12 characters, including uppercase, lowercase, a number,
          and a symbol.
        </p>
      </div>

      <div>
        <label
          htmlFor={`reset-confirm-password-${member.id}`}
          className="mb-2 block text-sm font-medium"
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
          {isSubmitting ? "Resetting…" : "Reset password"}
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
