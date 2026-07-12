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
    super(`${resource} with id '${id}' not found`);
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
    const errorName = error.statusCode === 401 ? "Unauthorized" : "Forbidden";
    return new Response(
      JSON.stringify({
        code: error.statusCode,
        message: error.message,
        error: errorName,
      }),
      { status: error.statusCode, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiValidationError) {
    return new Response(
      JSON.stringify({
        code: 422,
        message: error.message,
        error: "Unprocessable Entity",
        details: { field: error.field },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiNotFoundError) {
    return new Response(
      JSON.stringify({
        code: 404,
        message: error.message,
        error: "Not Found",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiRateLimitError) {
    return new Response(
      JSON.stringify({
        code: 429,
        message: error.message,
        error: "Too Many Requests",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  console.error("[API Error]", error);
  return new Response(
    JSON.stringify({
      code: defaultStatus,
      message: "An unexpected error occurred",
      error: "Internal Server Error",
    }),
    { status: defaultStatus, headers: { "Content-Type": "application/json" } }
  );
}
