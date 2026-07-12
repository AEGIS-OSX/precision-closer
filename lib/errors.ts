export class ApiAuthError extends Error {
  statusCode: 401 | 403;

  constructor(statusCode: 401 | 403, message: string) {
    super(message);
    this.name = "ApiAuthError";
    this.statusCode = statusCode;
  }
}

export class ApiValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "ApiValidationError";
    this.field = field;
  }
}

export class ApiNotFoundError extends Error {
  resource: string;
  id: string;

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
    this.name = "ApiNotFoundError";
    this.resource = resource;
    this.id = id;
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.statusCode, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiValidationError) {
    return new Response(
      JSON.stringify({ error: error.message, field: error.field }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiNotFoundError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (error instanceof ApiRateLimitError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  console.error("[API Error]", error);

  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: defaultStatus, headers: { "Content-Type": "application/json" } }
  );
}
