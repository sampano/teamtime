import { useState } from "react";
import type { FormEvent } from "react";
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

export default function TimeEntryFilterForm({
  clients,
  members,
  onApply,
}: TimeEntryFilterFormProps) {
  const [clientId, setClientId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [throughDate, setThroughDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (fromDate && throughDate && throughDate < fromDate) {
      setError("The end date cannot be before the start date.");
      return;
    }

    const filters: TimeEntryFilters = {};

    if (clientId) {
      filters.clientId = Number(clientId);
    }

    if (memberId) {
      filters.memberId = memberId;
    }

    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);

      if (!Number.isFinite(from.getTime())) {
        setError("Choose a valid start date.");
        return;
      }

      filters.fromUtc = from.toISOString();
    }

    if (throughDate) {
      const until = new Date(`${throughDate}T00:00:00`);

      if (!Number.isFinite(until.getTime())) {
        setError("Choose a valid end date.");
        return;
      }

      // Include the selected end date by using the next local midnight.
      until.setDate(until.getDate() + 1);
      filters.toUtc = until.toISOString();
    }

    onApply(filters);
  }

  function handleClear() {
    setClientId("");
    setMemberId("");
    setFromDate("");
    setThroughDate("");
    setError("");
    onApply({});
  }

  const fieldClassName =
    "w-full rounded-lg border border-brand-navy/30 " +
    "bg-brand-white px-3 py-3 text-sm " +
    "focus-visible:outline-2 focus-visible:outline-brand-navy";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filter time entries"
      className="rounded-xl border border-brand-navy/15 p-5"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor="filter-client"
            className="mb-2 block text-sm font-medium"
          >
            Client
          </label>

          <select
            id="filter-client"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
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

        <div>
          <label
            htmlFor="filter-member"
            className="mb-2 block text-sm font-medium"
          >
            Team member
          </label>

          <select
            id="filter-member"
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
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

        <div>
          <label
            htmlFor="filter-from"
            className="mb-2 block text-sm font-medium"
          >
            From date
          </label>

          <input
            id="filter-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label
            htmlFor="filter-through"
            className="mb-2 block text-sm font-medium"
          >
            Through date
          </label>

          <input
            id="filter-through"
            type="date"
            value={throughDate}
            onChange={(event) => setThroughDate(event.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      <p className="mt-3">
        Dates use your local timezone and filter when entries started.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-brand-red">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand-orange px-4 py-2
                     text-sm font-semibold text-brand-navy
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy"
        >
          Apply filters
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-brand-navy/30
                     px-4 py-2 text-sm
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy"
        >
          Clear filters
        </button>
      </div>
    </form>
  );
}
