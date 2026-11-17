import {
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Clock,
  BadgeCheck,
  KeyRound,
} from "lucide-react";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { ApiError } from "../api/http";
import type { CurrentUser } from "../api/auth";
import { getMembers } from "../api/members";
import type { MemberResponse } from "../api/members";
import CreateMemberForm from "../components/CreateMemberForm";
import MemberStatusButton from "../components/MemberStatusButton";
import MemberRoleButton from "../components/MemberRoleButton";
import ResetMemberPasswordForm from "../components/ResetMemberPasswordForm";
import { getTimeEntrySummary } from "../api/timeEntries";
import type { MemberTimeSummaryResponse } from "../api/timeEntries";

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

  const [memberTotals, setMemberTotals] = useState<
    Record<string, MemberTimeSummaryResponse>
  >({});
  const [resetMemberId, setResetMemberId] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  const [search, setSearch] = useState("");

  const [teamFilter, setTeamFilter] = useState<
    "all" | "admin" | "member" | "inactive"
  >("all");

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      try {
        const [members, summary] = await Promise.all([
          getMembers(),
          getTimeEntrySummary(),
        ]);

        if (!cancelled) {
          const totals: Record<string, MemberTimeSummaryResponse> = {};

          for (const member of summary.byMember) {
            totals[member.memberId] = member;
          }

          setMemberTotals(totals);
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

  const members = state.status === "success" ? state.members : [];

  const teamStats = [
    {
      label: "Total Members",
      value: members.length,
      icon: Users,
      className: "border-slate-200/70 bg-slate-50/80 text-slate-700",
    },
    {
      label: "Admins",
      value: members.filter((member) => member.roles.includes("Admin")).length,
      icon: ShieldCheck,
      className: "border-indigo-200/60 bg-indigo-50/60 text-brand-indigo",
    },
    {
      label: "Active",
      value: members.filter((member) => member.isActive).length,
      icon: UserCheck,
      className: "border-emerald-200/60 bg-emerald-50/60 text-emerald-700",
    },
  ];

  const filterOptions = [
    { value: "all", label: "All", count: members.length },
    {
      value: "admin",
      label: "Admins",
      count: members.filter((member) => member.roles.includes("Admin")).length,
    },
    {
      value: "member",
      label: "Members",
      count: members.filter((member) => member.roles.includes("Member")).length,
    },
    {
      value: "inactive",
      label: "Deactivated",
      count: members.filter((member) => !member.isActive).length,
    },
  ] as const;

  const query = search.trim().toLowerCase();

  const visibleMembers = members.filter((member) => {
    if (teamFilter === "admin" && !member.roles.includes("Admin")) {
      return false;
    }

    if (teamFilter === "member" && !member.roles.includes("Member")) {
      return false;
    }

    if (teamFilter === "inactive" && member.isActive) {
      return false;
    }

    return (
      member.fullName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });
  return (
    <section aria-labelledby="team-heading" className="space-y-6">
      <div
        className="rounded-2xl border border-slate-200/80
                 bg-white p-5 shadow-xs"
      >
        <div
          className="flex flex-col justify-between gap-4
                   sm:flex-row sm:items-center"
        >
          <div>
            <h1
              id="team-heading"
              className="font-display text-xl font-bold
                       tracking-tight text-slate-900"
            >
              Team
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              View and manage the people in your workspace.
            </p>
          </div>

          {currentUser.roles.includes("Admin") && (
            <button
              type="button"
              onClick={() => setShowAddMember(true)}
              disabled={showAddMember}
              aria-expanded={showAddMember}
              aria-controls="add-member-drawer"
              className="inline-flex h-10 items-center justify-center
                       gap-2 self-start rounded-xl bg-brand-coral
                       px-4 text-sm font-semibold text-white shadow-xs
                       hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo
                       disabled:opacity-60"
            >
              <Plus size={16} aria-hidden="true" />
              Add member
            </button>
          )}
        </div>

        <div
          className="mt-4 grid grid-cols-1 gap-3
                   border-t border-slate-100 pt-4 sm:grid-cols-3"
        >
          {teamStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={
                  "flex items-center justify-between gap-3 " +
                  "rounded-xl border px-3.5 py-2.5 " +
                  stat.className
                }
              >
                <span className="inline-flex items-center gap-2 text-xs font-medium">
                  <Icon size={14} aria-hidden="true" />
                  {stat.label}
                </span>

                <span className="text-base font-bold tabular-nums">
                  {state.status === "success" ? stat.value : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {state.status === "success" && (
          <div
            className="mt-4 flex flex-col gap-3 border-t border-slate-100
               pt-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div
              role="group"
              aria-label="Filter team members"
              className="inline-flex flex-wrap self-start rounded-xl
                 border border-slate-200/70 bg-slate-100/90 p-1"
            >
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={teamFilter === option.value}
                  disabled={resetMemberId !== null}
                  onClick={() => setTeamFilter(option.value)}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs transition-all " +
                    "focus-visible:outline-2 " +
                    "focus-visible:outline-brand-indigo disabled:opacity-50 " +
                    (teamFilter === option.value
                      ? "bg-white font-semibold text-brand-indigo shadow-2xs"
                      : "font-medium text-slate-600 hover:text-slate-900")
                  }
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2
                   left-3 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                aria-label="Search team members"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={resetMemberId !== null}
                className="h-9 w-full rounded-xl border border-slate-200
                   bg-slate-50/50 pr-3 pl-8 text-xs text-slate-800
                   placeholder:text-slate-400
                   focus:border-brand-indigo focus:bg-white
                   focus:outline-none focus:ring-2
                   focus:ring-brand-indigo/15 disabled:opacity-50"
              />
            </div>
          </div>
        )}
        {currentUser.roles.includes("Admin") && (
          <div
            id="add-member-drawer"
            hidden={!showAddMember}
            className="mt-5 border-t border-slate-200/80 pt-5"
          >
            {showAddMember && (
              <CreateMemberForm
                onSessionExpired={onSessionExpired}
                onCancel={() => setShowAddMember(false)}
                onCreated={(member) => {
                  setShowAddMember(false);
                  setNotice(`${member.fullName} was added to the team.`);
                  setState({ status: "loading" });
                  setAttempt((value) => value + 1);
                }}
              />
            )}
          </div>
        )}
      </div>

      <p
        role="status"
        className={
          notice
            ? "rounded-xl border border-emerald-200 bg-emerald-50 " +
              "px-4 py-3 text-xs text-emerald-800"
            : "sr-only"
        }
      >
        {notice}
      </p>

      <div>
        {state.status === "loading" && (
          <p role="status" className="text-sm text-slate-500">
            Loading team members…
          </p>
        )}

        {state.status === "error" && (
          <div
            className="space-y-4 rounded-2xl border
                     border-rose-200 bg-white p-5"
          >
            <p role="alert" className="text-xs text-rose-600">
              {state.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="rounded-xl bg-brand-coral px-4 py-2
                       text-xs font-semibold text-white
                       hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === "success" && (
          <>
            {visibleMembers.length === 0 ? (
              <p
                className="rounded-2xl border border-slate-200/80
                         bg-white p-6 text-sm text-slate-500"
              >
                {members.length === 0
                  ? "No team accounts were returned."
                  : "No matching team members found. Try another filter or search."}
              </p>
            ) : (
              <ul
                aria-label="Team members"
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {visibleMembers.map((member) => (
                  <li
                    key={member.id}
                    className={
                      "flex min-w-0 flex-col justify-between rounded-2xl " +
                      "border p-5 shadow-xs transition-all " +
                      (!member.isActive
                        ? "border-slate-200/80 bg-slate-50/90 opacity-85"
                        : member.id === currentUser.id
                          ? "border-indigo-200/90 bg-white"
                          : "border-slate-200/80 bg-white hover:border-slate-300/90 hover:shadow-sm")
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center
                 justify-center rounded-full border
                 border-indigo-200 bg-indigo-100
                 text-sm font-bold text-brand-indigo"
                        >
                          {member.fullName
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2
                              className="break-words font-display text-base
                     font-bold text-slate-900"
                            >
                              {member.fullName}
                            </h2>

                            {member.id === currentUser.id && (
                              <span
                                className="rounded-md bg-indigo-50 px-1.5 py-0.5
                       text-xs font-semibold text-brand-indigo"
                              >
                                (you)
                              </span>
                            )}
                          </div>

                          <p
                            title={member.email}
                            className="mt-0.5 truncate text-xs text-slate-500"
                          >
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {member.roles.map((role) => (
                          <span
                            key={role}
                            className={
                              "inline-flex items-center gap-1 rounded-full border " +
                              "px-2.5 py-0.5 text-xs " +
                              (role === "Admin"
                                ? "border-indigo-200/80 bg-indigo-50 font-semibold text-brand-indigo"
                                : "border-slate-200/80 bg-slate-100 font-medium text-slate-700")
                            }
                          >
                            {role === "Admin" && (
                              <ShieldCheck size={12} aria-hidden="true" />
                            )}
                            {role}
                          </span>
                        ))}

                        <span
                          className={
                            "inline-flex items-center gap-1.5 rounded-full " +
                            "px-2.5 py-0.5 text-xs " +
                            (member.isActive
                              ? "border border-emerald-200/80 bg-emerald-50 font-semibold text-emerald-700"
                              : "bg-slate-200/80 font-medium text-slate-600")
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              "h-1.5 w-1.5 rounded-full " +
                              (member.isActive
                                ? "bg-emerald-500"
                                : "bg-slate-400")
                            }
                          />

                          {member.isActive ? "Active" : "Deactivated"}
                        </span>
                      </div>
                    </div>
                    <div
                      className="mt-4 flex flex-wrap items-center justify-between
             gap-2 border-t border-slate-100 pt-3 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock size={14} aria-hidden="true" />
                        Tracked workload
                      </span>

                      <span className="tabular-nums text-slate-600">
                        <strong className="font-semibold text-slate-900">
                          {(memberTotals[member.id]?.totalHours ?? 0).toFixed(
                            2,
                          )}{" "}
                          hrs
                        </strong>
                        <span
                          aria-hidden="true"
                          className="mx-1 text-slate-400"
                        >
                          •
                        </span>
                        {memberTotals[member.id]?.entryCount ?? 0}{" "}
                        {memberTotals[member.id]?.entryCount === 1
                          ? "entry"
                          : "entries"}
                      </span>
                    </div>
                    {member.id === currentUser.id ? (
                      <div
                        className="mt-4 flex flex-wrap items-center justify-between
               gap-2 border-t border-slate-100 pt-3.5"
                      >
                        <span
                          className="inline-flex items-center gap-1.5
                 text-xs font-medium text-brand-indigo"
                        >
                          <BadgeCheck size={16} aria-hidden="true" />
                          Your account
                        </span>

                        <Link
                          to="/account"
                          className="rounded text-xs font-semibold text-slate-700
                 hover:text-brand-indigo hover:underline
                 focus-visible:outline-2
                 focus-visible:outline-brand-indigo"
                        >
                          Account settings →
                        </Link>
                      </div>
                    ) : currentUser.roles.includes("Admin") ? (
                      <div
                        className="mt-4 flex flex-wrap items-start justify-between
               gap-2 border-t border-slate-100 pt-3.5"
                      >
                        <div className="flex flex-wrap items-start gap-2">
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

                          {member.roles.includes("Member") &&
                            !member.roles.includes("Admin") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNotice("");
                                  setResetMemberId(member.id);
                                }}
                                aria-haspopup="dialog"
                                aria-label={`Reset password for ${member.fullName}`}
                                className="inline-flex items-center justify-center
                       gap-1.5 rounded-xl border border-slate-200
                       bg-white px-3 py-1.5 text-xs font-semibold
                       text-slate-700 transition-colors
                       hover:border-slate-300 hover:bg-slate-50
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo"
                              >
                                <KeyRound
                                  size={14}
                                  aria-hidden="true"
                                  className="text-slate-500"
                                />
                                Reset password
                              </button>
                            )}
                        </div>

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
                      </div>
                    ) : null}

                    {currentUser.roles.includes("Admin") &&
                      member.id !== currentUser.id &&
                      member.roles.includes("Member") &&
                      !member.roles.includes("Admin") &&
                      resetMemberId === member.id && (
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
                      )}
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
