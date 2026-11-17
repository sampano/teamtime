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
    <section aria-labelledby="time-entries-heading">
      <h2 id="time-entries-heading" className="text-xl font-semibold">
        Team time entries
      </h2>

      <p className="mt-2">
        Completed work across all team members. Dates and times are shown in
        your local timezone.
      </p>
      <div className="mt-6">
        {filterOptions.status === "loading" && (
          <p role="status">Loading filter options…</p>
        )}

        {filterOptions.status === "error" && (
          <div className="space-y-3">
            <p role="alert" className="text-brand-red">
              {filterOptions.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setFilterOptions({ status: "loading" });
                setOptionsAttempt((value) => value + 1);
              }}
              className="rounded-lg bg-brand-orange px-4 py-2
                   text-sm font-semibold text-brand-navy
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-brand-navy"
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
      {state.status === "success" && (
        <div className="mt-4">
          <ExportTimeEntriesButton
            filters={filters}
            onSessionExpired={onSessionExpired}
          />
        </div>
      )}
      {state.status === "success" && (
        <div className="mt-6">
          <TimeEntrySummary summary={state.summary} />
        </div>
      )}
      <p role="status" className="mt-4">
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
          <>
            {state.entries.length === 0 ? (
              <p className="rounded-xl border border-brand-navy/15 p-6">
                {page === 1
                  ? "No time entries match the current filters."
                  : "No entries on this page. Use Previous to go back."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-brand-navy/15">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Completed team time entries, page {page}
                  </caption>

                  <thead className="bg-brand-navy/5">
                    <tr>
                      <th scope="col" className="p-4">
                        Work / Client
                      </th>
                      <th scope="col" className="p-4">
                        Member
                      </th>
                      <th scope="col" className="p-4">
                        Start
                      </th>
                      <th scope="col" className="p-4">
                        End
                      </th>
                      <th scope="col" className="p-4">
                        Minutes
                      </th>
                      <th scope="col" className="p-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {state.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-t border-brand-navy/15"
                      >
                        <td className="min-w-56 p-4">
                          <p className="break-words font-medium">
                            {entry.description}
                          </p>
                          <p className="mt-1">{entry.clientName}</p>
                        </td>

                        <td className="p-4">{entry.memberName}</td>

                        <td className="whitespace-nowrap p-4">
                          {new Date(entry.startTimeUtc).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap p-4">
                          {new Date(entry.endTimeUtc).toLocaleString()}
                        </td>

                        <td className="p-4 tabular-nums">
                          {entry.durationMinutes.toFixed(2)}
                        </td>
                        <td className="p-4">
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
                              className="rounded-lg border border-brand-navy/30
                 px-4 py-2 text-sm
                 focus-visible:outline-2
                 focus-visible:outline-offset-2
                 focus-visible:outline-brand-navy
                 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <nav
              aria-label="Time entry pagination"
              className="mt-4 flex flex-wrap items-center gap-4"
            >
              <button
                type="button"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
                className="rounded-lg border border-brand-navy/30
                           px-4 py-2 text-sm
                           focus-visible:outline-2
                           focus-visible:outline-offset-2
                           focus-visible:outline-brand-navy
                           disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <p role="status">Page {page}</p>

              <button
                type="button"
                disabled={state.entries.length < PAGE_SIZE}
                onClick={() => changePage(page + 1)}
                className="rounded-lg border border-brand-navy/30
                           px-4 py-2 text-sm
                           focus-visible:outline-2
                           focus-visible:outline-offset-2
                           focus-visible:outline-brand-navy
                           disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
