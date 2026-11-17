import {
  Archive,
  Building2,
  Clock,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { getTimeEntrySummary } from "../api/timeEntries";
import type { ClientTimeSummaryResponse } from "../api/timeEntries";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "../api/http";
import { getClients, updateClientStatus } from "../api/clients";
import type { Client } from "../api/clients";
import EditClientForm from "./EditClientForm";

type ClientListProps = {
  canManage: boolean;
  onSessionExpired: () => void;
  header?: ReactNode;
};

type ListState =
  | { status: "loading" }
  | { status: "success"; clients: Client[] }
  | { status: "error"; message: string };

export default function ClientList({
  canManage,
  onSessionExpired,
  header,
}: ClientListProps) {
  const [state, setState] = useState<ListState>({
    status: "loading",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("all");

  const [clientTotals, setClientTotals] = useState<
    Record<number, ClientTimeSummaryResponse>
  >({});

  const [changingClientId, setChangingClientId] = useState<number | null>(null);

  const [statusError, setStatusError] = useState("");

  const [attempt, setAttempt] = useState(0);

  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  async function handleStatusChange(client: Client) {
    if (!canManage || changingClientId !== null || editingClientId !== null) {
      return;
    }

    setChangingClientId(client.id);
    setStatusError("");
    setNotice("");

    try {
      const updatedClient = await updateClientStatus(client.id, {
        isActive: !client.isActive,
      });

      setState((current) =>
        current.status === "success"
          ? {
              status: "success",
              clients: current.clients.map((item) =>
                item.id === updatedClient.id ? updatedClient : item,
              ),
            }
          : current,
      );

      setNotice(
        `${updatedClient.name} was ${
          updatedClient.isActive ? "restored" : "archived"
        }.`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setStatusError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to change client status."
          : error instanceof ApiError && error.status === 404
            ? "This client no longer exists. Refresh the list."
            : error instanceof Error
              ? error.message
              : "Unable to change client status.",
      );
    } finally {
      setChangingClientId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const [clients, summary] = await Promise.all([
          getClients(),
          getTimeEntrySummary(),
        ]);

        if (!cancelled) {
          const totals: Record<number, ClientTimeSummaryResponse> = {};

          for (const client of summary.byClient) {
            totals[client.clientId] = client;
          }

          setClientTotals(totals);
          setState({ status: "success", clients });
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
            error instanceof Error ? error.message : "Unable to load clients.",
        });
      }
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [attempt, onSessionExpired]);

  const clients = state.status === "success" ? state.clients : [];

  const activeCount = clients.filter((client) => client.isActive).length;

  const statusOptions = [
    { value: "all", label: "All", count: clients.length },
    { value: "active", label: "Active", count: activeCount },
    {
      value: "archived",
      label: "Archived",
      count: clients.length - activeCount,
    },
  ] as const;

  const query = search.trim().toLowerCase();

  const visibleClients = clients.filter((client) => {
    if (statusFilter === "active" && !client.isActive) {
      return false;
    }

    if (statusFilter === "archived" && client.isActive) {
      return false;
    }

    return client.name.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-slate-200/80
             bg-white p-5 shadow-xs"
      >
        {header}

        {state.status === "success" && (
          <div
            className={
              "flex flex-col gap-3 sm:flex-row sm:items-center " +
              "sm:justify-between " +
              (header ? "mt-4 border-t border-slate-100 pt-4" : "")
            }
          >
            <div
              role="group"
              aria-label="Filter clients by status"
              className="inline-flex flex-wrap self-start rounded-xl
                 border border-slate-200/70 bg-slate-100/90 p-1"
            >
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={statusFilter === option.value}
                  onClick={() => setStatusFilter(option.value)}
                  disabled={editingClientId !== null}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs transition-all " +
                    "focus-visible:outline-2 " +
                    "focus-visible:outline-brand-indigo disabled:opacity-50 " +
                    (statusFilter === option.value
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
                aria-label="Search clients"
                placeholder="Search clients..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={editingClientId !== null}
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
      </div>
      {state.status === "loading" && (
        <p role="status" className="text-sm text-slate-500">
          Loading clients…
        </p>
      )}

      {state.status === "error" && (
        <div
          className="space-y-3 rounded-2xl border border-rose-200
               bg-white p-5"
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
      {state.status === "success" && visibleClients.length === 0 && (
        <div
          className="rounded-2xl border border-slate-200/80
               bg-white px-4 py-14 text-center"
        >
          <Building2
            size={24}
            aria-hidden="true"
            className="mx-auto mb-3 text-slate-400"
          />

          <p className="text-sm font-semibold text-slate-700">
            {clients.length === 0
              ? "No clients have been added yet"
              : "No matching clients found"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {clients.length === 0
              ? canManage
                ? "Use Add client to create your first client."
                : "An administrator can add clients to this workspace."
              : "Try changing your status filter or search query."}
          </p>
        </div>
      )}
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
      {statusError && (
        <p role="alert" className="mb-4 text-brand-red">
          {statusError}
        </p>
      )}
      <ul
        aria-label="Clients"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {visibleClients.map((client) => (
          <li
            key={client.id}
            className={
              "flex min-w-0 flex-col justify-between rounded-2xl " +
              "border p-5 shadow-xs transition-all " +
              (client.isActive
                ? "border-slate-200/80 bg-white hover:border-slate-300/90 hover:shadow-sm"
                : "border-slate-200/80 bg-slate-50/80 opacity-90")
            }
          >
            {canManage && editingClientId === client.id ? (
              <EditClientForm
                key={client.id}
                client={client}
                onSessionExpired={onSessionExpired}
                onCancel={() => setEditingClientId(null)}
                onSaved={(updatedClient) => {
                  setState((current) =>
                    current.status === "success"
                      ? {
                          status: "success",
                          clients: current.clients
                            .map((item) =>
                              item.id === updatedClient.id
                                ? updatedClient
                                : item,
                            )
                            .sort((a, b) => a.name.localeCompare(b.name)),
                        }
                      : current,
                  );

                  setEditingClientId(null);
                  setNotice(`${updatedClient.name} was updated.`);
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full bg-brand-indigo"
                    />

                    <h2
                      className={
                        "break-words font-display text-base font-bold " +
                        (client.isActive ? "text-slate-900" : "text-slate-700")
                      }
                    >
                      {client.name}
                    </h2>
                  </div>

                  <span
                    className={
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full " +
                      "border px-2.5 py-0.5 text-xs " +
                      (client.isActive
                        ? "border-emerald-200/80 bg-emerald-50 font-semibold text-emerald-700"
                        : "border-slate-300/60 bg-slate-200/70 font-medium text-slate-600")
                    }
                  >
                    {client.isActive ? (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      />
                    ) : (
                      <Archive size={12} aria-hidden="true" />
                    )}

                    {client.isActive ? "Active" : "Archived"}
                  </span>
                </div>
                <div
                  className="mt-4 flex flex-wrap items-center justify-between
             gap-2 border-t border-slate-200/60 pt-3.5 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} aria-hidden="true" />
                    Tracked time
                  </span>

                  <span className="tabular-nums text-slate-600">
                    <strong className="font-semibold text-slate-900">
                      {(clientTotals[client.id]?.totalHours ?? 0).toFixed(2)}{" "}
                      hrs
                    </strong>
                    <span aria-hidden="true" className="mx-1 text-slate-400">
                      •
                    </span>
                    {clientTotals[client.id]?.entryCount ?? 0}{" "}
                    {clientTotals[client.id]?.entryCount === 1
                      ? "entry"
                      : "entries"}
                  </span>
                </div>
                {canManage && (
                  <div
                    className="mt-4 flex flex-wrap items-center gap-2
               border-t border-slate-100 pt-3.5"
                  >
                    <button
                      type="button"
                      disabled={
                        editingClientId !== null || changingClientId !== null
                      }
                      aria-label={`Edit ${client.name}`}
                      onClick={() => {
                        setNotice("");
                        setStatusError("");
                        setEditingClientId(client.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl
                 border border-slate-200 bg-white px-3 py-1.5
                 text-xs font-semibold text-slate-700
                 transition-colors hover:border-slate-300
                 hover:bg-slate-50
                 focus-visible:outline-2
                 focus-visible:outline-offset-2
                 focus-visible:outline-brand-indigo
                 disabled:opacity-60"
                    >
                      <Pencil
                        size={14}
                        aria-hidden="true"
                        className="text-slate-500"
                      />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={
                        editingClientId !== null || changingClientId !== null
                      }
                      onClick={() => handleStatusChange(client)}
                      aria-label={`${
                        client.isActive ? "Archive" : "Restore"
                      } ${client.name}`}
                      className={
                        "inline-flex items-center gap-1.5 rounded-xl border " +
                        "px-3 py-1.5 text-xs font-semibold transition-colors " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 " +
                        "focus-visible:outline-brand-indigo disabled:opacity-60 " +
                        (client.isActive
                          ? "border-rose-200/80 bg-white text-rose-600 hover:bg-rose-50"
                          : "border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                      }
                    >
                      {client.isActive ? (
                        <Archive size={14} aria-hidden="true" />
                      ) : (
                        <RotateCcw size={14} aria-hidden="true" />
                      )}

                      {changingClientId === client.id
                        ? "Saving…"
                        : client.isActive
                          ? "Archive"
                          : "Restore"}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
