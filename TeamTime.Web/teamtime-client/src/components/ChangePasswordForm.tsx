import { useState } from "react";
import type { FormEvent } from "react";
import { changePassword } from "../api/auth";
import { ApiError } from "../api/http";

type ChangePasswordFormProps = {
  onSessionExpired: () => void;
};

export default function ChangePasswordForm({
  onSessionExpired,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setNotice("");

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Your password was changed successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Unable to change your password.",
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
      aria-labelledby="change-password-heading"
      aria-busy={isSubmitting}
      className="max-w-xl rounded-xl border border-brand-navy/15 p-6"
    >
      <h2 id="change-password-heading" className="text-lg font-semibold">
        Change password
      </h2>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="mb-2 block text-sm font-medium"
          >
            Current password
          </label>

          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-medium"
          >
            New password
          </label>

          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            aria-describedby="password-requirements"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />

          <p id="password-requirements" className="mt-2">
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-medium"
          >
            Confirm new password
          </label>

          <input
            id="confirm-password"
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
      </div>

      {error && (
        <p role="alert" className="mt-4 text-brand-red">
          {error}
        </p>
      )}

      <p role="status" className="mt-4">
        {notice}
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-lg bg-brand-orange px-5 py-3
                   text-sm font-semibold text-brand-navy
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy
                   disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
