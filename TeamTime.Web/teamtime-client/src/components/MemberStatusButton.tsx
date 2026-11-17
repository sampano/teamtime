import { useEffect, useRef, useState } from "react";
import { LoaderCircle, UserCheck, UserX, X } from "lucide-react";
import { ApiError } from "../api/http";
import { updateMemberStatus } from "../api/members";
import type { MemberResponse } from "../api/members";

type MemberStatusButtonProps = {
  member: MemberResponse;
  onUpdated: (member: MemberResponse) => void;
  onSessionExpired: () => void;
};

export default function MemberStatusButton({
  member,
  onUpdated,
  onSessionExpired,
}: MemberStatusButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const action = member.isActive ? "Deactivate" : "Reactivate";
  const StatusIcon = member.isActive ? UserX : UserCheck;

  useEffect(() => {
    if (!isConfirming) {
      return;
    }

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
  }, [isConfirming]);

  function closeConfirmation() {
    if (!isSubmitting) {
      setIsConfirming(false);
      setError("");
    }
  }

  async function handleStatusChange() {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const updatedMember = await updateMemberStatus(member.id, {
        isActive: !member.isActive,
      });

      setIsConfirming(false);
      onUpdated(updatedMember);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to change member status."
          : error instanceof ApiError && error.status === 404
            ? "This account no longer exists. Cancel and refresh the team page."
            : error instanceof Error
              ? error.message
              : "Unable to change member status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsConfirming(true);
        }}
        disabled={isSubmitting}
        aria-label={`${action} ${member.fullName}`}
        aria-haspopup="dialog"
        className={
          "inline-flex items-center justify-center gap-1.5 " +
          "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
          "transition-colors focus-visible:outline-2 " +
          "focus-visible:outline-offset-2 " +
          "focus-visible:outline-brand-indigo disabled:opacity-60 " +
          (member.isActive
            ? "border-rose-200/80 bg-white text-rose-600 hover:bg-rose-50"
            : "border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
        }
      >
        <StatusIcon size={14} aria-hidden="true" />
        {action}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`member-status-heading-${member.id}`}
        aria-describedby={`member-status-description-${member.id}`}
        onCancel={(event) => {
          event.preventDefault();
          closeConfirmation();
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)]
                   w-[calc(100%-2rem)] max-w-md overflow-y-auto
                   rounded-2xl border border-slate-200 bg-white
                   p-0 text-slate-800 shadow-2xl
                   backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs"
      >
        <div className="space-y-5 p-5">
          <div className="flex items-start gap-3">
            <div
              className={
                "flex h-10 w-10 shrink-0 items-center " +
                "justify-center rounded-xl " +
                (member.isActive
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-700")
              }
            >
              <StatusIcon size={20} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                id={`member-status-heading-${member.id}`}
                className="font-display text-base font-bold text-slate-900"
              >
                {action} {member.fullName}?
              </h3>

              <p
                id={`member-status-description-${member.id}`}
                className="mt-2 text-xs leading-relaxed text-slate-500"
              >
                {member.isActive
                  ? "This member will lose workspace access. Their historical time entries will remain intact. Any running timer must be stopped first."
                  : "This member will regain access to the workspace and client timers."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeConfirmation}
              disabled={isSubmitting}
              aria-label="Close confirmation"
              className="rounded-lg p-1 text-slate-400
                         hover:bg-slate-100 hover:text-slate-600
                         focus-visible:outline-2
                         focus-visible:outline-brand-indigo
                         disabled:opacity-60"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={closeConfirmation}
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
              type="button"
              onClick={handleStatusChange}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={
                "inline-flex items-center justify-center gap-1.5 " +
                "rounded-xl px-4 py-2 text-xs font-semibold " +
                "text-white shadow-xs focus-visible:outline-2 " +
                "focus-visible:outline-offset-2 " +
                "focus-visible:outline-brand-indigo disabled:opacity-60 " +
                (member.isActive
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700")
              }
            >
              {isSubmitting && (
                <LoaderCircle
                  size={14}
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}

              {isSubmitting ? "Updating…" : action}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
