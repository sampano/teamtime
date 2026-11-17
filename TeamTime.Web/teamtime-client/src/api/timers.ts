import { apiRequest } from "./http";
import type { TimeEntryResponse } from "./timeEntries";

export type StartTimerRequest = {
  clientId: number;
  description: string;
};

export type RunningTimerResponse = {
  id: number;
  clientId: number;
  clientName: string;
  memberId: string;
  memberName: string;
  description: string;
  startTimeUtc: string;
};

export async function getCurrentTimer(): Promise<RunningTimerResponse | null> {
  return apiRequest<RunningTimerResponse>("/api/timers/current");
}

export async function startTimer(
  request: StartTimerRequest,
): Promise<RunningTimerResponse> {
  const timer = await apiRequest<RunningTimerResponse>("/api/timers/start", {
    method: "POST",
    body: request,
  });

  if (timer === null) {
    throw new Error("The server did not return the started timer.");
  }

  return timer;
}

export async function stopTimer(timerId: number): Promise<TimeEntryResponse> {
  const entry = await apiRequest<TimeEntryResponse>(
    `/api/timers/${timerId}/stop`,
    {
      method: "POST",
    },
  );

  if (entry === null) {
    throw new Error("The server did not return the completed entry.");
  }

  return entry;
}
