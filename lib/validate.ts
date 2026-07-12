import { ApiValidationError } from "@/lib/errors";

export function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

export function validateRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiValidationError(field, `${field} is required`);
  }
  return value.trim();
}

export function validateEnum<T extends string>(value: unknown, allowed: T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiValidationError(field, `${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function validateBatchSize(value: unknown): number {
  const num = typeof value === "string" ? parseInt(value, 10) : typeof value === "number" ? value : NaN;
  if (isNaN(num) || num < 1 || num > 10) {
    throw new ApiValidationError("batch_size", "batch_size must be between 1 and 10");
  }
  return num;
}
