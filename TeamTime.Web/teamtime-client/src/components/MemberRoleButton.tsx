import { LoaderCircle, Shield, User } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../api/http";
import { updateMemberRole } from "../api/members";
import type { MemberResponse } from "../api/members";

type MemberRoleButtonProps = {
  member: MemberResponse;
  onUpdated: (member: MemberResponse) => void;
  onSessionExpired: () => void;
};

export default function MemberRoleButton({
  member,
  onUpdated,
  onSessionExpired,
}: MemberRoleButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = member.roles.includes("Admin");
  const nextRole = isAdmin ? "Member" : "Admin";
  const promotionBlocked = !member.isActive && !isAdmin;

  async function handleRoleChange() {
    if (isSubmitting || promotionBlocked) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const updatedMember = await updateMemberRole(member.id, {
        role: nextRole,
      });

      onUpdated(updatedMember);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to change account roles."
          : error instanceof ApiError && error.status === 404
            ? "This account no longer exists. Refresh the team page."
            : error instanceof Error
              ? error.message
              : "Unable to change the account role.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRoleChange}
        disabled={isSubmitting || promotionBlocked}
        aria-label={`Make ${member.fullName} ${nextRole}`}
        aria-busy={isSubmitting}
        className="inline-flex items-center justify-center gap-1.5
                 rounded-xl border border-slate-200 bg-white
                 px-3 py-1.5 text-xs font-semibold text-slate-700
                 transition-colors hover:border-indigo-200
                 hover:bg-indigo-50 hover:text-brand-indigo
                 focus-visible:outline-2
                 focus-visible:outline-offset-2
                 focus-visible:outline-brand-indigo
                 disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle size={14} aria-hidden="true" className="animate-spin" />
        ) : isAdmin ? (
          <User size={14} aria-hidden="true" />
        ) : (
          <Shield size={14} aria-hidden="true" />
        )}

        <span>{isSubmitting ? "Updating…" : `Make ${nextRole}`}</span>
      </button>

      {promotionBlocked && (
        <p className="max-w-xs text-[11px] text-slate-500">
          Reactivate this account before promoting it to Admin.
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-xs text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
