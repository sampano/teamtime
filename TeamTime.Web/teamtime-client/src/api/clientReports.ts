import { apiRequest } from "./http";

export type ClientReportEntry = {
  memberName: string;
  description: string;
  startTimeUtc: string;
  endTimeUtc: string;
  durationMinutes: number;
};

export type ClientReport = {
  clientName: string;
  fromUtc: string | null;
  toUtc: string | null;
  generatedAtUtc: string;
  page: number;
  pageSize: number;
  entryCount: number;
  totalMinutes: number;
  totalHours: number;
  entries: ClientReportEntry[];
};

export async function getClientReport(
  token: string,
  page = 1,
  pageSize = 20,
): Promise<ClientReport> {
  const parameters = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const report = await apiRequest<ClientReport>(
    `/api/public/client-reports/${encodeURIComponent(token)}?${parameters}`,
  );

  if (report === null) {
    throw new Error("The server did not return the client report.");
  }

  return report;
}
