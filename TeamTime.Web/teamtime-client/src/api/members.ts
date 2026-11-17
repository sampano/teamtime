import { apiRequest } from "./http";

export type MemberResponse = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
};

export async function getMembers(): Promise<MemberResponse[]> {
  const members = await apiRequest<MemberResponse[]>("/api/members");

  if (members === null) {
    throw new Error("The server did not return a member list.");
  }

  return members;
}

export type CreateMemberRequest = {
  fullName: string;
  email: string;
  password: string;
};

export async function createMember(
  request: CreateMemberRequest,
): Promise<MemberResponse> {
  const member = await apiRequest<MemberResponse>("/api/members", {
    method: "POST",
    body: request,
  });

  if (member === null) {
    throw new Error("The server did not return the created member.");
  }

  return member;
}

export type UpdateMemberStatusRequest = {
  isActive: boolean;
};

export async function updateMemberStatus(
  id: string,
  request: UpdateMemberStatusRequest,
): Promise<MemberResponse> {
  const member = await apiRequest<MemberResponse>(
    `/api/members/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: request,
    },
  );

  if (member === null) {
    throw new Error("The server did not return the updated member status.");
  }

  return member;
}

export type UpdateMemberRoleRequest = {
  role: "Admin" | "Member";
};

export async function updateMemberRole(
  id: string,
  request: UpdateMemberRoleRequest,
): Promise<MemberResponse> {
  const member = await apiRequest<MemberResponse>(
    `/api/members/${encodeURIComponent(id)}/role`,
    {
      method: "PATCH",
      body: request,
    },
  );

  if (member === null) {
    throw new Error("The server did not return the updated member.");
  }

  return member;
}

export type ResetMemberPasswordRequest = {
  newPassword: string;
  confirmPassword: string;
};

export async function resetMemberPassword(
  id: string,
  request: ResetMemberPasswordRequest,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/members/${encodeURIComponent(id)}/reset-password`,
    {
      method: "POST",
      body: request,
    },
  );
}
