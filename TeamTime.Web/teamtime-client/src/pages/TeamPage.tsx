import { useEffect, useState } from "react";
import { ApiError } from "../api/http";
import type { CurrentUser } from "../api/auth";
import { getMembers } from "../api/members";
import type { MemberResponse } from "../api/members";
import CreateMemberForm from "../components/CreateMemberForm";
import MemberStatusButton from "../components/MemberStatusButton";
import MemberRoleButton from "../components/MemberRoleButton";
import ResetMemberPasswordForm from "../components/ResetMemberPasswordForm";

type TeamPageProps = {
  currentUser: CurrentUser;
  onSessionExpired: () => void;
};

type TeamState =
  | { status: "loading" }
  | { status: "success"; members: MemberResponse[] }
  | { status: "error"; message: string };

export default function TeamPage({
  currentUser,
  onSessionExpired,
}: TeamPageProps) {
  const [state, setState] = useState<TeamState>({
    status: "loading",
  });

  const [resetMemberId, setResetMemberId] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const members = await getMembers();

        if (!cancelled) {
          setState({ status: "success", members });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired();
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load the team.",
        });
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [attempt, onSessionExpired]);

  return (
    <section aria-labelledby="team-heading">
      <h1 id="team-heading" className="text-2xl font-semibold">
        Team
      </h1>

      <p className="mt-2">View the people in your workspace.</p>

      {currentUser.roles.includes("Admin") && (
        <div className="mt-6">
          <CreateMemberForm
            onSessionExpired={onSessionExpired}
            onCreated={(member) => {
              setNotice(`${member.fullName} was added to the team.`);
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      )}

      <p role="status" className="mt-4">
        {notice}
      </p>

      <div className="mt-6">
        {state.status === "loading" && (
          <p role="status">Loading team members…</p>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <p role="alert" className="text-brand-red">
              {state.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="rounded-lg bg-brand-orange px-4 py-3
                         text-sm font-semibold text-brand-navy
                         focus-visible:outline-2
                         focus-visible:outline-offset-2
                         focus-visible:outline-brand-navy"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === "success" && (
          <>
            {state.members.length === 0 ? (
              <p>No team accounts were returned.</p>
            ) : (
              <ul
                aria-label="Team members"
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {state.members.map((member) => (
                  <li
                    key={member.id}
                    className="rounded-xl border border-brand-navy/15 p-6"
                  >
                    <h2 className="break-words text-lg font-semibold">
                      {member.fullName}
                      {member.id === currentUser.id ? " (you)" : ""}
                    </h2>

                    <p className="mt-2 break-all">{member.email}</p>
                    <p className="mt-2">Role: {member.roles.join(", ")}</p>
                    <span
                      className={
                        "mt-4 inline-block rounded-full px-3 py-1 " +
                        (member.isActive
                          ? "bg-brand-orange/20 text-brand-navy"
                          : "bg-brand-navy/10 text-brand-navy")
                      }
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                    {currentUser.roles.includes("Admin") &&
                      member.id !== currentUser.id && (
                        <>
                          <MemberRoleButton
                            member={member}
                            onSessionExpired={onSessionExpired}
                            onUpdated={(updatedMember) => {
                              setNotice(
                                `${updatedMember.fullName}'s role is now ${updatedMember.roles.join(
                                  ", ",
                                )}.`,
                              );

                              setState({ status: "loading" });
                              setAttempt((value) => value + 1);
                            }}
                          />

                          {!member.roles.includes("Admin") && (
                            <MemberStatusButton
                              member={member}
                              onSessionExpired={onSessionExpired}
                              onUpdated={(updatedMember) => {
                                setNotice(
                                  `${updatedMember.fullName} was ${
                                    updatedMember.isActive
                                      ? "reactivated"
                                      : "deactivated"
                                  }.`,
                                );

                                setState({ status: "loading" });
                                setAttempt((value) => value + 1);
                              }}
                            />
                          )}
                        </>
                      )}
                    {currentUser.roles.includes("Admin") &&
                      member.id !== currentUser.id &&
                      member.roles.includes("Member") &&
                      !member.roles.includes("Admin") &&
                      (resetMemberId === member.id ? (
                        <ResetMemberPasswordForm
                          key={member.id}
                          member={member}
                          onSessionExpired={onSessionExpired}
                          onCancel={() => setResetMemberId(null)}
                          onReset={() => {
                            setResetMemberId(null);
                            setNotice(
                              `Password reset for ${member.fullName}. Share the replacement password privately with them.`,
                            );
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNotice("");
                            setResetMemberId(member.id);
                          }}
                          className="mt-4 rounded-lg border border-brand-navy/30
                   px-4 py-2 text-sm font-medium text-brand-navy
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy"
                        >
                          Reset password
                        </button>
                      ))}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
