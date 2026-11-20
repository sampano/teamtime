import { useEffect, useState } from "react";
import { Ban, LoaderCircle } from "lucide-react";
import { ApiError } from "../api/http";
import {
  getClientReportShares,
  revokeClientReportShare,
} from "../api/clientReportShares";
import type { ClientReportShare } from "../api/clientReportShares";

type ClientReportShareListProps = {
  clientId: number;
  refreshVersion: number;
  onSessionExpired: () => void;
};

type ListState =
  | { status: "loading" }
  | { status: "success"; shares: ClientReportShare[] }
  | { status: "error"; message: string };

export default function ClientReportShareList({
  clientId,
  refreshVersion,
  onSessionExpired,
}: ClientReportShareListProps) {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadShares() {
      try {
        const shares = await getClientReportShares(clientId);

        if (!cancelled) {
          setState({ status: "success", shares });
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
              : "Unable to load report links.",
        });
      }
    }

    void loadShares();

    return () => {
      cancelled = true;
    };
  }, [clientId, refreshVersion, attempt, onSessionExpired]);

  async function handleRevoke(shareId: number) {
    if (revokingId !== null) {
      return;
    }

    setRevokingId(shareId);
    setActionError("");
    setNotice("");

    try {
      await revokeClientReportShare(clientId, shareId);
      setConfirmingId(null);
      setNotice(`Report link #${shareId} was revoked.`);
      setState({ status: "loading" });
      setAttempt((value) => value + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to revoke the report link.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section
      aria-labelledby="existing-report-links-heading"
      className="space-y-3 border-t border-slate-100 p-5"
    >
      <h4
        id="existing-report-links-heading"
        className="font-display text-sm font-bold text-slate-900"
      >
        Existing report links
      </h4>

      <p className="text-xs text-slate-500">
        Full URLs are shown only when created. Revoking a link blocks future
        report requests; it cannot erase information already viewed.
      </p>

      <p
        role="status"
        className={notice ? "text-xs text-emerald-700" : "sr-only"}
      >
        {notice}
      </p>

      {actionError && (
        <p role="alert" className="text-xs text-rose-600">
          {actionError}
        </p>
      )}

      {state.status === "loading" && (
        <p role="status" className="text-xs text-slate-500">
          Loading links…
        </p>
      )}

      {state.status === "error" && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-rose-600">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5
                       text-xs font-semibold hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === "success" &&
        (state.shares.length === 0 ? (
          <p className="text-xs text-slate-500">
            No report links have been created.
          </p>
        ) : (
          <ul className="space-y-3">
            {state.shares.map((share) => {
              const expired =
                share.expiresAtUtc !== null &&
                Date.parse(share.expiresAtUtc) <= now;

              const status = share.revokedAtUtc
                ? "Revoked"
                : expired
                  ? "Expired"
                  : "Active";

              return (
                <li
                  key={share.id}
                  className="space-y-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">
                      Link #{share.id}
                    </p>

                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                        (status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500")
                      }
                    >
                      {status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500">
                    <p>
                      Created: {new Date(share.createdAtUtc).toLocaleString()}
                    </p>
                    <p>
                      From:{" "}
                      {share.fromUtc
                        ? new Date(share.fromUtc).toLocaleString()
                        : "No lower limit"}
                    </p>
                    <p>
                      Before:{" "}
                      {share.toUtc
                        ? new Date(share.toUtc).toLocaleString()
                        : "No upper limit"}
                    </p>
                    <p>
                      Expires:{" "}
                      {share.expiresAtUtc
                        ? new Date(share.expiresAtUtc).toLocaleString()
                        : "No expiration"}
                    </p>
                    {share.revokedAtUtc && (
                      <p>
                        Revoked: {new Date(share.revokedAtUtc).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {!share.revokedAtUtc &&
                    (confirmingId === share.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-700">
                          Disable this report link?
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={revokingId !== null}
                            onClick={() => setConfirmingId(null)}
                            className="rounded-lg border border-slate-200
                                       px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={revokingId !== null}
                            onClick={() => handleRevoke(share.id)}
                            className="inline-flex items-center gap-1.5
                                       rounded-lg bg-rose-600 px-3 py-1.5
                                       text-xs font-semibold text-white
                                       hover:bg-rose-700 disabled:opacity-50"
                          >
                            {revokingId === share.id && (
                              <LoaderCircle
                                size={12}
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            )}
                            {revokingId === share.id
                              ? "Revoking…"
                              : "Confirm revoke"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={revokingId !== null}
                        onClick={() => {
                          setActionError("");
                          setNotice("");
                          setConfirmingId(share.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg
                                   border border-rose-200 px-3 py-1.5
                                   text-xs font-semibold text-rose-600
                                   hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Ban size={12} aria-hidden="true" />
                        Revoke
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        ))}
    </section>
  );
}
