import { ApiError, apiRequest } from "./http";

export type LoginRequest = {
  email: string;
  password: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

type MessageResponse = {
  message: string;
};

export async function login(request: LoginRequest): Promise<void> {
  await apiRequest<MessageResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const user = await apiRequest<CurrentUser>("/api/auth/me");

    if (user === null) {
      throw new Error("The server did not return account details.");
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiRequest<MessageResponse>("/api/auth/logout", {
    method: "POST",
  });
}

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  await apiRequest<MessageResponse>("/api/auth/change-password", {
    method: "POST",
    body: request,
  });
}
