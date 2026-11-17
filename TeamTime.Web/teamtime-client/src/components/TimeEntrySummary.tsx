import type { TimeEntrySummaryResponse } from "../api/timeEntries";

type TimeEntrySummaryProps = {
  summary: TimeEntrySummaryResponse;
};

export default function TimeEntrySummary({ summary }: TimeEntrySummaryProps) {
  return (
    <section aria-labelledby="time-summary-heading">
      <h3 id="time-summary-heading" className="text-lg font-semibold">
        Time summary
      </h3>

      <p className="mt-2">
        Totals include all completed entries matching the applied filters,
        across every page.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-brand-navy/15 p-5">
          <p>Completed entries</p>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {summary.entryCount}
          </div>
        </div>

        <div className="rounded-xl border border-brand-navy/15 p-5">
          <p>Total hours</p>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {summary.totalHours.toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-brand-navy/15 p-5">
          <p>Total minutes</p>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {summary.totalMinutes.toFixed(2)}
          </div>
        </div>
      </div>

      {summary.entryCount === 0 ? (
        <p className="mt-4">No completed entries match the applied filters.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="client-summary-heading">
            <h4 id="client-summary-heading" className="font-semibold">
              By client
            </h4>

            <ul className="mt-3 divide-y divide-brand-navy/15">
              {summary.byClient.map((client) => (
                <li
                  key={client.clientId}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      {client.clientName}
                    </p>
                    <p>{client.entryCount} entries</p>
                  </div>

                  <p className="shrink-0 tabular-nums">
                    {client.totalHours.toFixed(2)} hrs
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="member-summary-heading">
            <h4 id="member-summary-heading" className="font-semibold">
              By team member
            </h4>

            <ul className="mt-3 divide-y divide-brand-navy/15">
              {summary.byMember.map((member) => (
                <li
                  key={member.memberId}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      {member.memberName}
                    </p>
                    <p>
                      {member.entryCount}{" "}
                      {member.entryCount === 1 ? "entry" : "entries"}
                    </p>
                  </div>

                  <p className="shrink-0 tabular-nums">
                    {member.totalHours.toFixed(2)} hrs
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}
