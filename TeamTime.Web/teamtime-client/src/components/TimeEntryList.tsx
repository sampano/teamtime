import { FileText, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../api/http";
import { getTimeEntries, getTimeEntrySummary } from "../api/timeEntries";
import type {
  TimeEntryResponse,
  TimeEntrySummaryResponse,
} from "../api/timeEntries";
import { getClients } from "../api/clients";
import type { Client } from "../api/clients";
import { getMembers } from "../api/members";
import type { MemberResponse } from "../api/members";
import TimeEntryFilterForm from "./TimeEntryFilterForm";
import type { TimeEntryFilters } from "./TimeEntryFilterForm";
import type { CurrentUser } from "../api/auth";
import EditTimeEntryForm from "./EditTimeEntryForm";
import TimeEntrySummary from "./TimeEntrySummary";
import ExportTimeEntriesButton from "./ExportTimeEntriesButton";
type TimeEntryListProps = {
  currentUser: CurrentUser;
  refreshVersion: number;
  onSessionExpired: () => void;
};

type ListState =
  | { status: "loading" }
  | {
      status: "success";
      entries: TimeEntryResponse[];
      summary: TimeEntrySummaryResponse;
    }
  | { status: "error"; message: string };

type FilterOptionsState =
  | { status: "loading" }
  | {
      status: "ready";
      clients: Client[];
      members: MemberResponse[];
    }
  | { status: "error"; message: string };

const PAGE_SIZE = 20;

export default function TimeEntryList({
  currentUser,
  refreshVersion,
  onSessionExpired,
}: TimeEntryListProps) {
  const [state, setState] = useState<ListState>({
    status: "loading",
  });

  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  const [filters, setFilters] = useState<TimeEntryFilters>({});

  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({
    status: "loading",
  });

  const [optionsAttempt, setOptionsAttempt] = useState(0);

  const [editingEntry, setEditingEntry] = useState<TimeEntryResponse | null>(
    null,
  );

  const [editNotice, setEditNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const [clients, members] = await Promise.all([
          getClients(),
          getMembers(),
        ]);

        if (!cancelled) {
          setFilterOptions({
            status: "ready",
            clients,
            members,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired();
          return;
        }

        setFilterOptions({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load filter options.",
        });
      }
    }

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [optionsAttempt, onSessionExpired]);
  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      try {
        const [entries, summary] = await Promise.all([
          getTimeEntries({
            ...filters,
            page,
            pageSize: PAGE_SIZE,
          }),
          getTimeEntrySummary(filters),
        ]);

        if (!cancelled) {
          setState({
            status: "success",
            entries,
            summary,
          });
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
            error instanceof Error
              ? error.message
              : "Unable to load time entries.",
        });
      }
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, [page, attempt, filters, refreshVersion, onSessionExpired]);

  function changePage(nextPage: number) {
    setState({ status: "loading" });
    setPage(nextPage);
  }

  return (
    <section
      aria-labelledby="time-entries-heading"
      className="min-w-0 space-y-6"
    >
      <div
        className="space-y-4 rounded-2xl border
                 border-slate-200/80 bg-white p-5 shadow-xs"
      >
        <div
          className="flex flex-col gap-4 lg:flex-row
                   lg:items-center lg:justify-between"
        >
          <div>
            <h2
              id="time-entries-heading"
              className="font-display text-sm font-bold text-slate-900"
            >
              Team time entries
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Completed work across all team members. Dates and times are shown
              in your local timezone.
            </p>
          </div>

          {state.status === "success" && (
            <ExportTimeEntriesButton
              filters={filters}
              onSessionExpired={onSessionExpired}
            />
          )}
        </div>

        <div>
          {filterOptions.status === "loading" && (
            <p role="status" className="text-xs text-slate-500">
              Loading filter options…
            </p>
          )}

          {filterOptions.status === "error" && (
            <div className="space-y-3">
              <p role="alert" className="text-xs text-rose-600">
                {filterOptions.message}
              </p>

              <button
                type="button"
                onClick={() => {
                  setFilterOptions({ status: "loading" });
                  setOptionsAttempt((value) => value + 1);
                }}
                className="rounded-xl bg-brand-coral px-4 py-2
                         text-xs font-semibold text-white
                         hover:bg-brand-coral-hover
                         focus-visible:outline-2
                         focus-visible:outline-offset-2
                         focus-visible:outline-brand-indigo"
              >
                Retry filter options
              </button>
            </div>
          )}

          {filterOptions.status === "ready" && (
            <TimeEntryFilterForm
              clients={filterOptions.clients}
              members={filterOptions.members}
              onApply={(nextFilters) => {
                setState({ status: "loading" });
                setPage(1);
                setFilters(nextFilters);
              }}
            />
          )}
        </div>
      </div>

      {state.status === "success" && (
        <TimeEntrySummary summary={state.summary} />
      )}
      <p
        role="status"
        className={
          editNotice
            ? "rounded-xl border border-emerald-200 bg-emerald-50 " +
              "px-3 py-2 text-xs text-emerald-800"
            : "sr-only"
        }
      >
        {editNotice}
      </p>

      {editingEntry && filterOptions.status === "ready" && (
        <div className="mt-6">
          <EditTimeEntryForm
            key={editingEntry.id}
            entry={editingEntry}
            clients={filterOptions.clients}
            onSessionExpired={onSessionExpired}
            onCancel={() => setEditingEntry(null)}
            onSaved={(updatedEntry) => {
              setEditingEntry(null);
              setEditNotice(`Time entry ${updatedEntry.id} was updated.`);
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      )}
      <div className="mt-6">
        {state.status === "loading" && (
          <p role="status">Loading time entries…</p>
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
              className="rounded-lg bg-brand-orange px-4 py-2
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
          <div
            className="min-w-0 overflow-hidden rounded-2xl border
               border-slate-200/80 bg-white shadow-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <caption className="sr-only">
                  Completed team time entries, page {page}
                </caption>

                <thead>
                  <tr
                    className="border-b border-slate-200/80 bg-slate-50/80
                       text-[11px] font-bold uppercase
                       tracking-wider text-slate-600"
                  >
                    <th scope="col" className="px-4 py-3.5">
                      Work / Client
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Member
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Start
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      End
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Minutes
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {state.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <FileText
                          size={24}
                          aria-hidden="true"
                          className="mx-auto mb-3 text-slate-400"
                        />

                        <p className="text-sm font-medium text-slate-600">
                          {page === 1
                            ? "No time entries match the selected filters."
                            : "No entries on this page. Use Previous to go back."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    state.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="min-w-56 px-4 py-3">
                          <p className="max-w-sm break-words font-semibold text-slate-900">
                            {entry.description}
                          </p>

                          <span
                            className="mt-1 inline-flex rounded-md border
                               border-indigo-200/70 bg-indigo-50
                               px-2 py-0.5 text-[11px]
                               font-medium text-brand-indigo"
                          >
                            {entry.clientName}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 shrink-0 items-center
                                 justify-center rounded-full
                                 bg-indigo-100 text-[10px]
                                 font-bold text-brand-indigo"
                            >
                              {entry.memberName
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase() || "?"}
                            </span>

                            <span className="whitespace-nowrap font-medium">
                              {entry.memberName}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500">
                          {new Date(entry.startTimeUtc).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500">
                          {new Date(entry.endTimeUtc).toLocaleString()}
                        </td>

                        <td
                          className="px-4 py-3 text-right font-mono
                             font-semibold tabular-nums text-slate-900"
                        >
                          {entry.durationMinutes.toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {(currentUser.roles.includes("Admin") ||
                            entry.memberId === currentUser.id) && (
                            <button
                              type="button"
                              disabled={
                                editingEntry !== null ||
                                filterOptions.status !== "ready"
                              }
                              aria-label={`Edit time entry ${entry.id}`}
                              onClick={() => {
                                setEditNotice("");
                                setEditingEntry(entry);
                              }}
                              className="inline-flex items-center gap-1.5
                                 rounded-lg border border-slate-200
                                 bg-white px-2.5 py-1.5
                                 text-xs font-semibold text-slate-600
                                 transition-colors hover:bg-indigo-50
                                 hover:text-brand-indigo
                                 focus-visible:outline-2
                                 focus-visible:outline-offset-2
                                 focus-visible:outline-brand-indigo
                                 disabled:opacity-50"
                            >
                              <Pencil size={13} aria-hidden="true" />
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <nav
              aria-label="Time entry pagination"
              className="flex flex-wrap items-center justify-between
                 gap-3 border-t border-slate-200/80
                 bg-slate-50/50 px-4 py-3"
            >
              <p className="text-xs text-slate-500">
                {state.entries.length === 0
                  ? "No entries on this page"
                  : `Showing ${(page - 1) * PAGE_SIZE + 1}–${
                      (page - 1) * PAGE_SIZE + state.entries.length
                    } of ${state.summary.entryCount} entries`}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                  className="rounded-lg border border-slate-200 bg-white
                     px-3 py-1.5 text-xs font-semibold text-slate-600
                     hover:bg-slate-50 focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-40"
                >
                  Previous
                </button>

                <p
                  role="status"
                  className="rounded-lg bg-indigo-50 px-3 py-1.5
                     text-xs font-bold text-brand-indigo"
                >
                  Page {page}
                </p>

                <button
                  type="button"
                  disabled={
                    state.entries.length < PAGE_SIZE ||
                    page * PAGE_SIZE >= state.summary.entryCount
                  }
                  onClick={() => changePage(page + 1)}
                  className="rounded-lg border border-slate-200 bg-white
                     px-3 py-1.5 text-xs font-semibold text-slate-600
                     hover:bg-slate-50 focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
