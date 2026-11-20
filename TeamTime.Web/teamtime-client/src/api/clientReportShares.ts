import { apiRequest } from "./http";

export type ClientReportShare = {
  id: number;
  clientId: number;
  createdAtUtc: string;
  fromUtc: string | null;
  toUtc: string | null;
  expiresAtUtc: string | null;
  revokedAtUtc: string | null;
};

export type CreateClientReportShareRequest = {
  fromUtc?: string;
  toUtc?: string;
  expiresAtUtc?: string;
};

export type CreateClientReportShareResponse = {
  share: ClientReportShare;
  token: string;
};

export async function createClientReportShare(
  clientId: number,
  request: CreateClientReportShareRequest,
): Promise<CreateClientReportShareResponse> {
  const result = await apiRequest<CreateClientReportShareResponse>(
    `/api/clients/${clientId}/report-shares`,
    {
      method: "POST",
      body: request,
    },
  );

  if (result === null) {
    throw new Error("The server did not return the report link.");
  }

  return result;
}

export async function getClientReportShares(
  clientId: number,
): Promise<ClientReportShare[]> {
  const shares = await apiRequest<ClientReportShare[]>(
    `/api/clients/${clientId}/report-shares`,
  );

  if (shares === null) {
    throw new Error("The server did not return the report links.");
  }

  return shares;
}

export async function revokeClientReportShare(
  clientId: number,
  shareId: number,
): Promise<void> {
  await apiRequest<void>(
    `/api/clients/${clientId}/report-shares/${shareId}/revoke`,
    {
      method: "POST",
    },
  );
}
