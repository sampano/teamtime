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
    "h-10 w-full rounded-xl border border-slate-200 " +
    "bg-white px-3.5 text-sm text-slate-800 " +
    "placeholder:text-slate-400 focus:border-brand-indigo " +
    "focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 " +
    "disabled:opacity-60";

  const labelClassName = "mb-1.5 block text-xs font-semibold text-slate-700";

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="change-password-heading"
      aria-busy={isSubmitting}
      className="w-full max-w-xl space-y-5 rounded-2xl
               border border-slate-200/80 bg-white p-6 shadow-xs"
    >
      <h2
        id="change-password-heading"
        className="font-display text-base font-bold text-slate-900"
      >
        Change password
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="current-password" className={labelClassName}>
            Current password
          </label>

          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-password" className={labelClassName}>
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
            placeholder="••••••••••••"
            aria-describedby="password-requirements"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />

          <p
            id="password-requirements"
            className="mt-1.5 text-[11px] leading-relaxed text-slate-500"
          >
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className={labelClassName}>
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
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}

      <p
        role="status"
        className={
          notice
            ? "rounded-xl border border-emerald-200 bg-emerald-50 " +
              "px-3 py-2 text-xs text-emerald-800"
            : "sr-only"
        }
      >
        {notice}
      </p>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center
                   rounded-xl bg-brand-coral px-5
                   text-sm font-semibold text-white shadow-xs
                   transition-all hover:bg-brand-coral-hover
                   active:scale-[0.99]
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-indigo
                   disabled:opacity-60"
        >
          {isSubmitting ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
