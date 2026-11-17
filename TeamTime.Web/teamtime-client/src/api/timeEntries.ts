import { apiRequest } from "./http";
export type TimeEntryResponse = {
  id: number;
  clientId: number;
  clientName: string;
  memberId: string;
  memberName: string;
  description: string;
  startTimeUtc: string;
  endTimeUtc: string;
  durationMinutes: number;
};

export type TimeEntryQuery = {
  page?: number;
  pageSize?: number;
  clientId?: number;
  memberId?: string;
  fromUtc?: string;
  toUtc?: string;
};

export async function getTimeEntries(
  query: TimeEntryQuery = {},
): Promise<TimeEntryResponse[]> {
  const parameters = new URLSearchParams();

  parameters.set("page", String(query.page ?? 1));
  parameters.set("pageSize", String(query.pageSize ?? 50));

  if (query.clientId !== undefined) {
    parameters.set("clientId", String(query.clientId));
  }

  if (query.memberId !== undefined) {
    parameters.set("memberId", query.memberId);
  }

  if (query.fromUtc !== undefined) {
    parameters.set("fromUtc", query.fromUtc);
  }

  if (query.toUtc !== undefined) {
    parameters.set("toUtc", query.toUtc);
  }

  const entries = await apiRequest<TimeEntryResponse[]>(
    `/api/time-entries?${parameters.toString()}`,
  );

  if (entries === null) {
    throw new Error("The server did not return time entries.");
  }

  return entries;
}

export type CreateTimeEntryRequest = {
  clientId: number;
  description: string;
  startTimeUtc: string;
  endTimeUtc: string;
};

export async function createTimeEntry(
  request: CreateTimeEntryRequest,
): Promise<TimeEntryResponse> {
  const entry = await apiRequest<TimeEntryResponse>("/api/time-entries", {
    method: "POST",
    body: request,
  });

  if (entry === null) {
    throw new Error("The server did not return the created time entry.");
  }

  return entry;
}

export type UpdateTimeEntryRequest = {
  clientId: number;
  description: string;
  startTimeUtc: string;
  endTimeUtc: string;
};

export async function updateTimeEntry(
  id: number,
  request: UpdateTimeEntryRequest,
): Promise<TimeEntryResponse> {
  const entry = await apiRequest<TimeEntryResponse>(`/api/time-entries/${id}`, {
    method: "PUT",
    body: request,
  });

  if (entry === null) {
    throw new Error("The server did not return the updated time entry.");
  }

  return entry;
}

export type ClientTimeSummaryResponse = {
  clientId: number;
  clientName: string;
  entryCount: number;
  totalMinutes: number;
  totalHours: number;
};

export type MemberTimeSummaryResponse = {
  memberId: string;
  memberName: string;
  entryCount: number;
  totalMinutes: number;
  totalHours: number;
};

export type TimeEntrySummaryResponse = {
  entryCount: number;
  totalMinutes: number;
  totalHours: number;
  byClient: ClientTimeSummaryResponse[];
  byMember: MemberTimeSummaryResponse[];
};

export async function getTimeEntrySummary(
  filters: Omit<TimeEntryQuery, "page" | "pageSize"> = {},
): Promise<TimeEntrySummaryResponse> {
  const parameters = new URLSearchParams();

  if (filters.clientId !== undefined) {
    parameters.set("clientId", String(filters.clientId));
  }

  if (filters.memberId !== undefined) {
    parameters.set("memberId", filters.memberId);
  }

  if (filters.fromUtc !== undefined) {
    parameters.set("fromUtc", filters.fromUtc);
  }

  if (filters.toUtc !== undefined) {
    parameters.set("toUtc", filters.toUtc);
  }

  const queryString = parameters.toString();

  const summary = await apiRequest<TimeEntrySummaryResponse>(
    `/api/time-entries/summary${queryString ? `?${queryString}` : ""}`,
  );

  if (summary === null) {
    throw new Error("The server did not return a time summary.");
  }

  return summary;
}
