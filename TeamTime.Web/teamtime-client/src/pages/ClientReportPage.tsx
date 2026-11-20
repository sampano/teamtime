import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Clock, RefreshCw } from "lucide-react";
import { ApiError } from "../api/http";
import { getClientReport } from "../api/clientReports";
import type { ClientReport } from "../api/clientReports";

type ReportState =
  | { status: "loading" }
  | { status: "success"; requestKey: string; report: ClientReport }
  | { status: "error"; requestKey: string; unavailable: boolean };

const PAGE_SIZE = 20;

export default function ClientReportPage() {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return <UnavailableReport />;
  }

  return <ReportContent key={token} token={token} />;
}

function UnavailableReport() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-canvas p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-xl font-bold text-slate-900">
          Report unavailable
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          This report link is unavailable or has expired. Contact the person who
          shared it for a new link.
        </p>
      </section>
    </main>
  );
}

function ReportContent({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ReportState>({
    status: "loading",
  });

  const requestKey = `${page}:${attempt}`;

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        const report = await getClientReport(token, page, PAGE_SIZE);

        if (!cancelled) {
          setState({ status: "success", requestKey, report });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            requestKey,
            unavailable: error instanceof ApiError && error.status === 404,
          });
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [token, page, attempt, requestKey]);

  const loading = state.status === "loading" || state.requestKey !== requestKey;

  if (!loading && state.status === "error" && state.unavailable) {
    return <UnavailableReport />;
  }

  const report = !loading && state.status === "success" ? state.report : null;

  return (
    <div className="min-h-screen bg-brand-canvas font-sans text-slate-800">
      <header className="border-b border-slate-200/80 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Clock size={20} className="text-brand-coral" aria-hidden="true" />
          <span className="font-display text-lg font-bold text-brand-indigo">
            TeamTime
          </span>
          <span className="ml-2 text-xs text-slate-500">
            Shared time report
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {loading && (
          <p role="status" className="text-sm text-slate-500">
            Loading report…
          </p>
        )}

        {!loading && state.status === "error" && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <p role="alert" className="text-sm text-rose-600">
              Unable to load the report. Please try again.
            </p>

            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="rounded-xl bg-brand-coral px-4 py-2 text-xs
                         font-semibold text-white hover:bg-brand-coral-hover"
            >
              Retry
            </button>
          </div>
        )}

        {report && (
          <>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="break-words font-display text-xl font-bold text-slate-900">
                    {report.clientName}
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    Completed work. Dates and times are shown in your local
                    timezone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl
                             border border-slate-200 px-3 py-2 text-xs
                             font-semibold hover:bg-slate-50"
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Refresh report
                </button>
              </div>

              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>
                  Start range:{" "}
                  {report.fromUtc
                    ? new Date(report.fromUtc).toLocaleString()
                    : "No lower limit"}
                </p>
                <p>
                  Before:{" "}
                  {report.toUtc
                    ? new Date(report.toUtc).toLocaleString()
                    : "No upper limit"}
                </p>
                <p>
                  Entries are selected by their start time; full durations are
                  included.
                </p>
                <p>
                  Updated: {new Date(report.generatedAtUtc).toLocaleString()}
                </p>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Completed entries", String(report.entryCount)],
                ["Total hours", report.totalHours.toFixed(2)],
                ["Total minutes", report.totalMinutes.toFixed(2)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4"
                >
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-brand-indigo">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section
              aria-label="Completed work"
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <caption className="sr-only">
                    Completed work for {report.clientName}, page {page}
                  </caption>

                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600">
                    <tr>
                      {["Work", "Member", "Start", "End", "Minutes"].map(
                        (heading) => (
                          <th key={heading} scope="col" className="px-4 py-3">
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {report.entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          {page === 1
                            ? "No completed work matches this report."
                            : "No entries on this page. Use Previous to go back."}
                        </td>
                      </tr>
                    ) : (
                      report.entries.map((entry, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="max-w-sm break-words px-4 py-3 font-medium">
                            {entry.description}
                          </td>
                          <td className="px-4 py-3">{entry.memberName}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                            {new Date(entry.startTimeUtc).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                            {new Date(entry.endTimeUtc).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            {entry.durationMinutes.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <nav
                aria-label="Report pagination"
                className="flex flex-wrap items-center justify-between gap-3
                           border-t border-slate-200 bg-slate-50/50 px-4 py-3"
              >
                <p className="text-xs text-slate-500">Page {page}</p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((value) => value - 1)}
                    className="rounded-lg border border-slate-200 bg-white
                               px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      report.entries.length < PAGE_SIZE ||
                      page * PAGE_SIZE >= report.entryCount
                    }
                    onClick={() => setPage((value) => value + 1)}
                    className="rounded-lg border border-slate-200 bg-white
                               px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
