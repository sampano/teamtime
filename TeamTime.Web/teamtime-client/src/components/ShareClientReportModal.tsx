import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Copy, Link2, X } from "lucide-react";
import { ApiError } from "../api/http";
import { createClientReportShare } from "../api/clientReportShares";
import type { CreateClientReportShareRequest } from "../api/clientReportShares";
import type { Client } from "../api/clients";
import ClientReportShareList from "./ClientReportShareList";

type ShareClientReportModalProps = {
  client: Client;
  onClose: () => void;
  onSessionExpired: () => void;
};

export default function ShareClientReportModal({
  client,
  onClose,
  onSessionExpired,
}: ShareClientReportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fromDate, setFromDate] = useState("");
  const [throughDate, setThroughDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;

      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || shareUrl) {
      return;
    }

    setError("");

    if (fromDate && throughDate && throughDate < fromDate) {
      setError("The through date cannot be before the from date.");
      return;
    }

    const request: CreateClientReportShareRequest = {};

    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);

      if (!Number.isFinite(from.getTime())) {
        setError("Choose a valid from date.");
        return;
      }

      request.fromUtc = from.toISOString();
    }

    if (throughDate) {
      const until = new Date(`${throughDate}T00:00:00`);
      until.setDate(until.getDate() + 1);

      if (!Number.isFinite(until.getTime())) {
        setError("Choose a valid through date.");
        return;
      }

      request.toUtc = until.toISOString();
    }

    if (expiresAt) {
      const expiration = new Date(expiresAt);

      if (
        !Number.isFinite(expiration.getTime()) ||
        expiration.getTime() <= Date.now()
      ) {
        setError("Choose an expiration in the future.");
        return;
      }

      request.expiresAtUtc = expiration.toISOString();
    }

    setIsSubmitting(true);

    try {
      const result = await createClientReportShare(client.id, request);

      if (!result.token) {
        throw new Error(
          "The link may have been created, but its token was not returned. Close this dialog and check the share list.",
        );
      }

      const url = new URL(
        `/reports/${encodeURIComponent(result.token)}`,
        window.location.origin,
      );

      setShareUrl(url.href);
      setListVersion((value) => value + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }

      setError(
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to share client reports."
          : error instanceof Error
            ? error.message
            : "Unable to create the report link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl || isCopying) {
      return;
    }

    setIsCopying(true);
    setCopyNotice("");

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyNotice("Report link copied.");
    } catch {
      setCopyNotice(
        "Unable to copy automatically. Select and copy the link below.",
      );
    } finally {
      setIsCopying(false);
    }
  }

  const fieldClassName =
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 " +
    "bg-white px-3 text-sm text-slate-800 " +
    "focus:border-brand-indigo focus:outline-none " +
    "focus:ring-2 focus:ring-brand-indigo/20";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`share-report-heading-${client.id}`}
      onCancel={(event) => {
        event.preventDefault();

        if (!isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)]
                 w-[calc(100%-2rem)] max-w-lg overflow-y-auto
                 rounded-2xl border border-slate-200 bg-white
                 p-0 text-slate-800 shadow-2xl
                 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3
            id={`share-report-heading-${client.id}`}
            className="font-display text-base font-bold text-slate-900"
          >
            Share client report
          </h3>

          <p className="mt-1 break-words text-xs text-slate-500">
            {client.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close share report"
          className="rounded-lg p-1.5 text-slate-400
                     hover:bg-slate-100 hover:text-slate-600
                     focus-visible:outline-2
                     focus-visible:outline-brand-indigo
                     disabled:opacity-60"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {shareUrl ? (
        <div className="space-y-4 p-5">
          <p role="status" className="text-sm font-semibold text-emerald-700">
            Report link created.
          </p>

          <p className="text-xs text-slate-500">
            Copy this link before closing. The full link cannot be retrieved
            later; you can revoke it and create another.
          </p>

          <div>
            <label
              htmlFor="created-report-url"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Private report link
            </label>

            <input
              id="created-report-url"
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className={fieldClassName}
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={isCopying}
            className="inline-flex items-center gap-1.5 rounded-xl
                       border border-slate-200 px-3 py-2 text-xs
                       font-semibold hover:bg-slate-50
                       focus-visible:outline-2
                       focus-visible:outline-brand-indigo
                       disabled:opacity-60"
          >
            <Copy size={14} aria-hidden="true" />
            {isCopying ? "Copying…" : "Copy link"}
          </button>

          <p
            role="status"
            className={copyNotice ? "text-xs text-slate-600" : "sr-only"}
          >
            {copyNotice}
          </p>

          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Anyone with this link can view this client’s report without signing
            in. Share it privately.
          </p>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-brand-coral px-4 py-2
                         text-xs font-semibold text-white
                         hover:bg-brand-coral-hover"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="space-y-4 p-5"
        >
          <p className="text-xs leading-relaxed text-slate-500">
            Share a live, read-only report of completed work. Leave the dates
            blank to include all completed entries.
          </p>

          <fieldset
            disabled={isSubmitting}
            className="min-w-0 space-y-4 disabled:opacity-60"
          >
            <legend className="sr-only">Report link options</legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="share-from"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  From date
                </label>
                <input
                  id="share-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="share-through"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Through date
                </label>
                <input
                  id="share-through"
                  type="date"
                  value={throughDate}
                  onChange={(event) => setThroughDate(event.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Dates use your local timezone. Entries are selected by their start
              time, including each entry’s full duration.
            </p>

            <div>
              <label
                htmlFor="share-expiration"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Link expiration (optional)
              </label>
              <input
                id="share-expiration"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className={fieldClassName}
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Leave blank for no expiration. You can revoke the link later.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3.5 py-2
                           text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl
                           bg-brand-coral px-4 py-2 text-xs font-semibold
                           text-white hover:bg-brand-coral-hover"
              >
                <Link2 size={14} aria-hidden="true" />
                {isSubmitting ? "Creating…" : "Create link"}
              </button>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}
        </form>
      )}
      <ClientReportShareList
        clientId={client.id}
        refreshVersion={listVersion}
        onSessionExpired={onSessionExpired}
      />
    </dialog>
  );
}
