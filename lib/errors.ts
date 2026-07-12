import type { ApiError } from "./types";

export class ApiAuthError extends Error {
  statusCode: 401 | 403;
  constructor(statusCode: 401 | 403, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiAuthError";
  }
}

export class ApiValidationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
    this.name = "ApiValidationError";
  }
}

export class ApiNotFoundError extends Error {
  resource: string;
  id: string;
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.resource = resource;
    this.id = id;
    this.name = "ApiNotFoundError";
  }
}

export class ApiRateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "ApiRateLimitError";
  }
}

export function errorResponse(error: unknown, defaultStatus = 500): Response {
  if (error instanceof ApiAuthError) {
    const body: ApiError = {
      code: error.statusCode,
      message: error.message,
      error: error.name,
    };
    return new Response(JSON.stringify(body), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof ApiValidationError) {
    const body: ApiError = {
      code: 422,
      message: error.message,
      error: error.name,
      details: { field: error.field },
    };
    return new Response(JSON.stringify(body), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof ApiNotFoundError) {
    const body: ApiError = {
      code: 404,
      message: error.message,
      error: error.name,
      details: { resource: error.resource, id: error.id },
    };
    return new Response(JSON.stringify(body), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof ApiRateLimitError) {
    const body: ApiError = {
      code: 429,
      message: error.message,
      error: error.name,
    };
    return new Response(JSON.stringify(body), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.error("[API Error]", error);
  const body: ApiError = {
    code: defaultStatus,
    message: "Internal Server Error",
    error: "InternalServerError",
  };
  return new Response(JSON.stringify(body), {
    status: defaultStatus,
    headers: { "Content-Type": "application/json" },
  });
}
