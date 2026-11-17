import { useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
            ? "This account no longer exists. Refresh the team page."
            : error instanceof Error
              ? error.message
              : "Unable to change member status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={handleStatusChange}
        disabled={isSubmitting}
        aria-label={`${
          member.isActive ? "Deactivate" : "Reactivate"
        } ${member.fullName}`}
        className={
          "rounded-lg border px-4 py-2 text-sm font-medium " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 " +
          "focus-visible:outline-brand-navy " +
          "disabled:cursor-not-allowed disabled:opacity-60 " +
          (member.isActive
            ? "border-brand-red/30 text-brand-red"
            : "border-brand-navy/30 text-brand-navy")
        }
      >
        {isSubmitting
          ? "Updating…"
          : member.isActive
            ? "Deactivate"
            : "Reactivate"}
      </button>

      {error && (
        <p role="alert" className="text-brand-red">
          {error}
        </p>
      )}
    </div>
  );
}
