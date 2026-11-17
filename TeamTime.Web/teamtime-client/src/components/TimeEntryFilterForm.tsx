import { useState } from "react";
import type { Client } from "../api/clients";
import type { MemberResponse } from "../api/members";
import type { TimeEntryQuery } from "../api/timeEntries";

export type TimeEntryFilters = Pick<
  TimeEntryQuery,
  "clientId" | "memberId" | "fromUtc" | "toUtc"
>;

type TimeEntryFilterFormProps = {
  clients: Client[];
  members: MemberResponse[];
  onApply: (filters: TimeEntryFilters) => void;
};

type FilterValues = {
  clientId: string;
  memberId: string;
  fromDate: string;
  throughDate: string;
};

const emptyValues: FilterValues = {
  clientId: "",
  memberId: "",
  fromDate: "",
  throughDate: "",
};

export default function TimeEntryFilterForm({
  clients,
  members,
  onApply,
}: TimeEntryFilterFormProps) {
  const [values, setValues] = useState<FilterValues>(emptyValues);
  const [error, setError] = useState("");

  function applyValues(next: FilterValues) {
    setError("");

    if (next.fromDate && next.throughDate && next.throughDate < next.fromDate) {
      setError("The end date cannot be before the start date.");
      return;
    }

    const filters: TimeEntryFilters = {};

    if (next.clientId) {
      filters.clientId = Number(next.clientId);
    }

    if (next.memberId) {
      filters.memberId = next.memberId;
    }

    if (next.fromDate) {
      const from = new Date(`${next.fromDate}T00:00:00`);

      if (!Number.isFinite(from.getTime())) {
        setError("Choose a valid start date.");
        return;
      }

      filters.fromUtc = from.toISOString();
    }

    if (next.throughDate) {
      const until = new Date(`${next.throughDate}T00:00:00`);

      if (!Number.isFinite(until.getTime())) {
        setError("Choose a valid end date.");
        return;
      }

      until.setDate(until.getDate() + 1);

      if (!Number.isFinite(until.getTime())) {
        setError("Choose a valid end date.");
        return;
      }

      filters.toUtc = until.toISOString();
    }

    onApply(filters);
  }

  function updateValue(field: keyof FilterValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    applyValues(next);
  }

  function handleClear() {
    setValues(emptyValues);
    setError("");
    onApply({});
  }

  const fieldClassName =
    "h-9 w-full min-w-0 rounded-xl border border-slate-200 " +
    "bg-slate-50/50 px-3 text-xs text-slate-800 " +
    "focus:border-brand-indigo focus:outline-none " +
    "focus:ring-2 focus:ring-brand-indigo/15";

  const labelClassName = "mb-1 block text-xs font-semibold text-slate-700";

  return (
    <form
      aria-label="Filter time entries"
      onSubmit={(event) => {
        event.preventDefault();
        applyValues(values);
      }}
      className="space-y-3"
    >
      <div
        className="grid grid-cols-1 gap-3 pt-2
                   sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="min-w-0">
          <label htmlFor="filter-client" className={labelClassName}>
            Client
          </label>

          <select
            id="filter-client"
            value={values.clientId}
            onChange={(event) => updateValue("clientId", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All clients</option>

            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {!client.isActive ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="filter-member" className={labelClassName}>
            Team member
          </label>

          <select
            id="filter-member"
            value={values.memberId}
            onChange={(event) => updateValue("memberId", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All team members</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
                {!member.isActive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="filter-from" className={labelClassName}>
            From date
          </label>

          <input
            id="filter-from"
            type="date"
            value={values.fromDate}
            onChange={(event) => updateValue("fromDate", event.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="filter-through" className={labelClassName}>
            Through date
          </label>

          <input
            id="filter-through"
            type="date"
            value={values.throughDate}
            onChange={(event) => updateValue("throughDate", event.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-slate-400">
          Dates use your local timezone and filter when entries started.
        </p>

        <button
          type="button"
          onClick={handleClear}
          className="rounded text-xs font-semibold text-brand-indigo
                     hover:underline focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-indigo"
        >
          Clear filters
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error} The previous valid filters remain applied.
        </p>
      )}
    </form>
  );
}
