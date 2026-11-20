import type { TimeEntrySummaryResponse } from "../api/timeEntries";

type TimeEntrySummaryProps = {
  summary: TimeEntrySummaryResponse;
};

export default function TimeEntrySummary({ summary }: TimeEntrySummaryProps) {
  const totals = [
    {
      label: "Completed entries",
      value: String(summary.entryCount),
      color: "text-slate-900",
    },
    {
      label: "Total hours",
      value: summary.totalHours.toFixed(2),
      color: "text-brand-indigo",
    },
    {
      label: "Total minutes",
      value: summary.totalMinutes.toFixed(2),
      color: "text-slate-900",
    },
  ];

  const breakdowns = [
    {
      id: "client-summary-heading",
      title: "By client",
      barColor: "bg-brand-indigo",
      items: summary.byClient.map((client) => ({
        id: String(client.clientId),
        name: client.clientName,
        entryCount: client.entryCount,
        totalHours: client.totalHours,
        totalMinutes: client.totalMinutes,
      })),
    },
    {
      id: "member-summary-heading",
      title: "By team member",
      barColor: "bg-brand-coral",
      items: summary.byMember.map((member) => ({
        id: member.memberId,
        name: member.memberName,
        entryCount: member.entryCount,
        totalHours: member.totalHours,
        totalMinutes: member.totalMinutes,
      })),
    },
  ];

  return (
    <section aria-labelledby="time-summary-heading" className="space-y-4">
      <div>
        <h3
          id="time-summary-heading"
          className="font-display text-sm font-bold text-slate-900"
        >
          Time summary
        </h3>

        <p className="mt-0.5 text-xs text-slate-500">
          Totals include all completed entries matching the applied filters,
          across every page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {totals.map((total) => (
          <div
            key={total.label}
            className="rounded-2xl border border-slate-200/80
                       bg-white p-4"
          >
            <p className="text-xs font-medium text-slate-500">{total.label}</p>

            <p
              className={"mt-1 text-2xl font-bold tabular-nums " + total.color}
            >
              {total.value}
            </p>
          </div>
        ))}
      </div>

      {summary.entryCount === 0 ? (
        <p
          className="rounded-2xl border border-slate-200/80
                     bg-white p-4 text-xs text-slate-500"
        >
          No completed entries match the applied filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {breakdowns.map((breakdown) => (
            <section
              key={breakdown.id}
              aria-labelledby={breakdown.id}
              className="min-w-0 rounded-2xl border
                         border-slate-200/80 bg-white p-4"
            >
              <h4
                id={breakdown.id}
                className="mb-3 text-xs font-bold uppercase
                           tracking-wider text-slate-800"
              >
                {breakdown.title}
              </h4>

              <ul className="space-y-2.5">
                {breakdown.items.map((item) => {
                  const percentage =
                    summary.totalMinutes > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (item.totalMinutes / summary.totalMinutes) * 100,
                          ),
                        )
                      : 0;

                  return (
                    <li key={item.id} className="space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words text-xs font-semibold text-slate-800">
                          {item.name}
                        </p>

                        <p className="shrink-0 text-xs tabular-nums text-slate-600">
                          {item.totalHours.toFixed(2)} hrs{" "}
                          <span className="text-slate-400">
                            ({item.entryCount})
                          </span>
                        </p>
                      </div>

                      <div
                        role="meter"
                        aria-label={`${item.name}: share of total filtered time`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Number(percentage.toFixed(1))}
                        aria-valuetext={`${percentage.toFixed(1)} percent of total filtered time`}
                        className="h-1.5 w-full overflow-hidden
                     rounded-full bg-slate-100"
                      >
                        <div
                          aria-hidden="true"
                          className={`h-full rounded-full ${breakdown.barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
