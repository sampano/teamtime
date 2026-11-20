import { useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Sparkles, X } from "lucide-react";
import {
  generateStrongPassword,
  getPasswordRequirements,
} from "../utils/password";
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

  const [showPassword, setShowPassword] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const [isCopying, setIsCopying] = useState(false);

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

  const passwordRequirements = getPasswordRequirements(newPassword);

  function handleGeneratePassword() {
    setError("");
    setCopyNotice("");

    try {
      const generated = generateStrongPassword();
      setNewPassword(generated);
      setConfirmPassword(generated);
    } catch {
      setError("Unable to generate a password. Please enter one manually.");
    }
  }

  async function handleCopyCredentials() {
    if (isCopying || isSubmitting) {
      return;
    }

    setCopyNotice("");

    if (
      !passwordRequirements.every((requirement) => requirement.met) ||
      newPassword !== confirmPassword
    ) {
      setCopyNotice(
        "Enter matching passwords that meet all requirements before copying.",
      );
      return;
    }

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(
        [
          "TeamTime password reset",
          `Member: ${member.fullName}`,
          `Email: ${member.email}`,
          `New password: ${newPassword}`,
        ].join("\n"),
      );

      setCopyNotice(
        "Draft replacement credentials copied. Complete the reset successfully before sharing them.",
      );
    } catch {
      setCopyNotice("Unable to copy. Use Show password to copy it manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setCopyNotice("");

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
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`reset-password-${member.id}`}
              className="text-xs font-semibold text-slate-700"
            >
              New password
            </label>

            <button
              type="button"
              onClick={handleGeneratePassword}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 rounded-lg
                 border border-indigo-200/70 bg-indigo-50
                 px-2.5 py-1 text-xs font-semibold text-brand-indigo
                 hover:bg-indigo-100/80
                 focus-visible:outline-2
                 focus-visible:outline-brand-indigo
                 disabled:opacity-60"
            >
              <Sparkles size={14} aria-hidden="true" />
              Generate password
            </button>
          </div>

          <div className="relative">
            <input
              id={`reset-confirm-password-${member.id}`}
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setCopyNotice("");
              }}
              disabled={isSubmitting}
              className={`${inputClassName} font-mono`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              aria-pressed={showPassword}
              aria-controls={`reset-password-${member.id} reset-confirm-password-${member.id}`}
              className="absolute top-1/2 right-2.5 -translate-y-1/2
                 rounded p-1 text-slate-400 hover:text-slate-600
                 focus-visible:outline-2
                 focus-visible:outline-brand-indigo
                 disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          <p
            id={`reset-requirements-${member.id}`}
            className="text-[11px] leading-relaxed text-slate-500"
          >
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>

          <ul
            aria-label="Password requirements"
            className="grid grid-cols-2 gap-2"
          >
            {passwordRequirements.map((requirement) => (
              <li
                key={requirement.label}
                className={
                  "flex items-center gap-1.5 rounded-lg border " +
                  "px-2.5 py-1 text-[11px] " +
                  (requirement.met
                    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                    : "border-slate-200/80 bg-white text-slate-500")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "h-1.5 w-1.5 shrink-0 rounded-full " +
                    (requirement.met ? "bg-emerald-500" : "bg-slate-300")
                  }
                />

                <span>
                  {requirement.label}
                  <span className="sr-only">
                    {requirement.met ? ": met" : ": not met"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
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
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopyCredentials}
            disabled={isSubmitting || isCopying}
            className="inline-flex items-center gap-1.5 rounded-lg
               border border-slate-200 bg-white px-3 py-1.5
               text-xs font-semibold text-slate-700
               hover:bg-slate-50
               focus-visible:outline-2
               focus-visible:outline-brand-indigo
               disabled:opacity-60"
          >
            <Copy size={14} aria-hidden="true" />
            {isCopying ? "Copying…" : "Copy credentials"}
          </button>

          <p
            role="status"
            className={copyNotice ? "text-xs text-slate-600" : "sr-only"}
          >
            {copyNotice}
          </p>
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
