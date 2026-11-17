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
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={handleRoleChange}
        disabled={isSubmitting || promotionBlocked}
        aria-label={`Make ${member.fullName} ${nextRole}`}
        className="rounded-lg border border-brand-navy/30
                   px-4 py-2 text-sm font-medium text-brand-navy
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy
                   disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Updating…" : `Make ${nextRole}`}
      </button>

      {promotionBlocked && (
        <p>Reactivate this account before promoting it to Admin.</p>
      )}

      {error && (
        <p role="alert" className="text-brand-red">
          {error}
        </p>
      )}
    </div>
  );
}
