import { Check, Copy, Eye, EyeOff, Lock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/http";
import { createMember } from "../api/members";
import type { MemberResponse } from "../api/members";
import {
  generateStrongPassword,
  getPasswordRequirements,
} from "../utils/password";

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

  const [showPassword, setShowPassword] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  const passwordRequirements = getPasswordRequirements(password);

  function handleGeneratePassword() {
    setCopyNotice("");
    setError("");

    try {
      setPassword(generateStrongPassword());
    } catch {
      setError("Unable to generate a password. Please enter one manually.");
    }
  }

  async function handleCopyCredentials() {
    if (isCopying) {
      return;
    }

    setCopyNotice("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !passwordRequirements.every((requirement) => requirement.met)
    ) {
      setCopyNotice(
        "Enter the member's name, email, and a password meeting all requirements.",
      );
      return;
    }

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(
        [
          "TeamTime account credentials",
          `Member: ${fullName.trim()}`,
          `Email: ${email.trim()}`,
          `Password: ${password}`,
        ].join("\n"),
      );

      setCopyNotice(
        "Draft credentials copied. Create the account successfully before sharing them.",
      );
    } catch {
      setCopyNotice(
        "Unable to copy credentials. You can use Show password to copy them manually.",
      );
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
      setShowPassword(false);
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
              onChange={(event) => {
                setFullName(event.target.value);
                setCopyNotice("");
              }}
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
              onChange={(event) => {
                setEmail(event.target.value);
                setCopyNotice("");
              }}
              className={fieldClassName}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="member-password"
              className="text-xs font-semibold text-slate-700"
            >
              Initial password
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 rounded-lg
                   border border-indigo-200/70 bg-indigo-50
                   px-2.5 py-1 text-xs font-semibold text-brand-indigo
                   hover:bg-indigo-100/80
                   focus-visible:outline-2
                   focus-visible:outline-brand-indigo"
              >
                <Sparkles size={14} aria-hidden="true" />
                Generate strong password
              </button>

              <button
                type="button"
                onClick={handleCopyCredentials}
                disabled={isCopying}
                className="inline-flex items-center gap-1 rounded-lg
                   border border-slate-200 bg-white px-2.5 py-1
                   text-xs font-semibold text-slate-700
                   hover:bg-slate-100
                   focus-visible:outline-2
                   focus-visible:outline-brand-indigo
                   disabled:opacity-60"
              >
                <Copy size={14} aria-hidden="true" className="text-slate-500" />
                {isCopying ? "Copying…" : "Copy credentials"}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              id="member-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              placeholder="At least 12 characters..."
              aria-describedby="member-password-help"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setCopyNotice("");
              }}
              className={`${fieldClassName} pr-10 font-mono placeholder:font-sans`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="member-password"
              className="absolute top-1/2 right-2.5 -translate-y-1/2
                 rounded p-1 text-slate-400 hover:text-slate-600
                 focus-visible:outline-2
                 focus-visible:outline-brand-indigo"
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          <p
            id="member-password-help"
            className="mt-1.5 text-[11px] leading-relaxed text-slate-500"
          >
            Use at least 12 characters, including uppercase, lowercase, a
            number, and a symbol.
          </p>

          <ul
            aria-label="Password requirements"
            className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4"
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

          <p
            role="status"
            className={copyNotice ? "mt-2 text-xs text-slate-600" : "sr-only"}
          >
            {copyNotice}
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
