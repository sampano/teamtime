type ValidationErrors = Record<string, string[]>;

type ApiProblem = {
  message?: string;
  title?: string;
  errors?: ValidationErrors;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ValidationErrors;

  constructor(message: string, status: number, errors: ValidationErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function readResponse<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    const problem: ApiProblem | null = await response.json().catch(() => null);

    const errors = problem?.errors ?? {};
    const validationMessage = Object.values(errors).flat().join(" ");

    throw new ApiError(
      validationMessage ||
        problem?.message ||
        problem?.title ||
        `Request failed (${response.status}).`,
      response.status,
      errors,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

async function getCsrfToken(): Promise<string> {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const result = await readResponse<{ token: string }>(response);

  if (!result?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return result.token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  if (!path.startsWith("/api/")) {
    throw new Error("API paths must start with /api/.");
  }

  const method = options.method ?? "GET";
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (method !== "GET") {
    headers.set("X-CSRF-TOKEN", await getCsrfToken());
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  return readResponse<T>(response);
}
