import { useEffect, useState } from "react";
import { ApiError } from "../api/http";
import { getClients, updateClientStatus } from "../api/clients";
import type { Client } from "../api/clients";
import EditClientForm from "./EditClientForm";

type ClientListProps = {
  canManage: boolean;
  onSessionExpired: () => void;
};

type ListState =
  | { status: "loading" }
  | { status: "success"; clients: Client[] }
  | { status: "error"; message: string };

export default function ClientList({
  canManage,
  onSessionExpired,
}: ClientListProps) {
  const [state, setState] = useState<ListState>({
    status: "loading",
  });

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
        const clients = await getClients();

        if (!cancelled) {
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

  if (state.status === "loading") {
    return <p role="status">Loading clients…</p>;
  }

  if (state.status === "error") {
    return (
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
    );
  }

  if (state.clients.length === 0) {
    return (
      <div className="rounded-xl border border-brand-navy/15 p-6">
        <p>No clients have been added yet.</p>
      </div>
    );
  }

  return (
    <div>
      <p role="status" className="mb-4">
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
        {state.clients.map((client) => (
          <li
            key={client.id}
            className="rounded-xl border border-brand-navy/15
                     bg-brand-white p-6"
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
                <h2 className="break-words text-lg font-semibold">
                  {client.name}
                </h2>

                <span
                  className={
                    "mt-4 inline-block rounded-full px-3 py-1 " +
                    (client.isActive
                      ? "bg-brand-orange/20 text-brand-navy"
                      : "bg-brand-navy/10 text-brand-navy")
                  }
                >
                  {client.isActive ? "Active" : "Archived"}
                </span>

                {canManage && (
                  <div className="mt-4 flex flex-wrap gap-3">
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
                      className="rounded-lg border border-brand-navy/30
                               px-4 py-2 text-sm font-medium
                               focus-visible:outline-2
                               focus-visible:outline-offset-2
                               focus-visible:outline-brand-navy
                               disabled:cursor-not-allowed
                               disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={
                        editingClientId !== null || changingClientId !== null
                      }
                      onClick={() => handleStatusChange(client)}
                      aria-label={`${client.isActive ? "Archive" : "Restore"} ${client.name}`}
                      className={
                        "rounded-lg border px-4 py-2 text-sm font-medium " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 " +
                        "focus-visible:outline-brand-navy " +
                        "disabled:cursor-not-allowed disabled:opacity-60 " +
                        (client.isActive
                          ? "border-brand-red/30 text-brand-red"
                          : "border-brand-navy/30 text-brand-navy")
                      }
                    >
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
