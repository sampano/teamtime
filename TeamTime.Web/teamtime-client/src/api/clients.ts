import { apiRequest } from "./http";

export type Client = {
  id: number;
  name: string;
  isActive: boolean;
};

export async function getClients(): Promise<Client[]> {
  const clients = await apiRequest<Client[]>("/api/clients");

  if (clients === null) {
    throw new Error("The server did not return a client list.");
  }

  return clients;
}

export type CreateClientRequest = {
  name: string;
};

export async function createClient(
  request: CreateClientRequest,
): Promise<Client> {
  const client = await apiRequest<Client>("/api/clients", {
    method: "POST",
    body: request,
  });

  if (client === null) {
    throw new Error("The server did not return the created client.");
  }

  window.dispatchEvent(new Event("teamtime:workspace-changed"));

  return client;
}

export type UpdateClientRequest = {
  name: string;
};

export async function updateClient(
  id: number,
  request: UpdateClientRequest,
): Promise<Client> {
  const client = await apiRequest<Client>(`/api/clients/${id}`, {
    method: "PUT",
    body: request,
  });

  if (client === null) {
    throw new Error("The server did not return the updated client.");
  }

  return client;
}

export type UpdateClientStatusRequest = {
  isActive: boolean;
};

export async function updateClientStatus(
  id: number,
  request: UpdateClientStatusRequest,
): Promise<Client> {
  const client = await apiRequest<Client>(`/api/clients/${id}/status`, {
    method: "PATCH",
    body: request,
  });

  if (client === null) {
    throw new Error("The server did not return the updated client status.");
  }

  window.dispatchEvent(new Event("teamtime:workspace-changed"));

  return client;
}
