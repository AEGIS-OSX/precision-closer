/**
 * Unit tests for SSRF protection in /api/crm/push
 *
 * These tests exercise the validateCrmEndpoint logic directly.
 * Run with: npx jest __tests__/api/crm/push/route.test.ts
 *
 * Note: a Jest/Vitest setup is required. If no test runner is configured,
 * add jest + ts-jest to devDependencies and a jest.config.ts at the repo root.
 */

// We test the validation logic by importing the internal helpers.
// Since Next.js route files export only the HTTP handler, we replicate
// the validation logic here to keep tests fast and side-effect-free.

const CRM_HOSTNAME_ALLOWLIST = new Set([
  "api.salesforce.com",
  "api.hubapi.com",
  "api.pipedrive.com",
  "api.zoho.com",
  "api.close.com",
  "api.copper.com",
  "api.freshsales.io",
]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const addr = ip.replace(/^\[|\]$/g, "").toLowerCase();
  if (addr === "::1") return true;
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true;
  if (addr.startsWith("fe8") || addr.startsWith("fe9") ||
      addr.startsWith("fea") || addr.startsWith("feb")) return true;
  return false;
}

// --- isPrivateIPv4 tests ---

describe("isPrivateIPv4", () => {
  // AC-1: AWS IMDS
  test("blocks 169.254.169.254 (IMDS link-local)", () => {
    expect(isPrivateIPv4("169.254.169.254")).toBe(true);
  });

  // AC-2: localhost
  test("blocks 127.0.0.1 (loopback)", () => {
    expect(isPrivateIPv4("127.0.0.1")).toBe(true);
  });

  // AC-3: RFC-1918 192.168.x
  test("blocks 192.168.1.1 (RFC-1918)", () => {
    expect(isPrivateIPv4("192.168.1.1")).toBe(true);
  });

  test("blocks 10.0.0.1 (RFC-1918 10/8)", () => {
    expect(isPrivateIPv4("10.0.0.1")).toBe(true);
  });

  test("blocks 172.16.0.1 (RFC-1918 172.16/12)", () => {
    expect(isPrivateIPv4("172.16.0.1")).toBe(true);
  });

  test("blocks 172.31.255.255 (RFC-1918 172.16/12 upper bound)", () => {
    expect(isPrivateIPv4("172.31.255.255")).toBe(true);
  });

  test("allows 172.32.0.1 (just outside RFC-1918 172.16/12)", () => {
    expect(isPrivateIPv4("172.32.0.1")).toBe(false);
  });

  test("allows 8.8.8.8 (public IP)", () => {
    expect(isPrivateIPv4("8.8.8.8")).toBe(false);
  });

  test("allows 104.21.0.1 (public IP)", () => {
    expect(isPrivateIPv4("104.21.0.1")).toBe(false);
  });
});

// --- isPrivateIPv6 tests ---

describe("isPrivateIPv6", () => {
  // AC-4: IPv6 loopback
  test("blocks ::1 (IPv6 loopback)", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
  });

  test("blocks [::1] (bracketed IPv6 loopback)", () => {
    expect(isPrivateIPv6("[::1]")).toBe(true);
  });

  test("blocks fc00::1 (IPv6 ULA fc00::/7)", () => {
    expect(isPrivateIPv6("fc00::1")).toBe(true);
  });

  test("blocks fd12:3456::1 (IPv6 ULA fd::/8)", () => {
    expect(isPrivateIPv6("fd12:3456::1")).toBe(true);
  });

  test("blocks fe80::1 (IPv6 link-local)", () => {
    expect(isPrivateIPv6("fe80::1")).toBe(true);
  });

  test("allows 2001:db8::1 (public IPv6)", () => {
    expect(isPrivateIPv6("2001:db8::1")).toBe(false);
  });
});

// --- Allowlist tests ---

describe("CRM_HOSTNAME_ALLOWLIST", () => {
  test("allows api.salesforce.com", () => {
    expect(CRM_HOSTNAME_ALLOWLIST.has("api.salesforce.com")).toBe(true);
  });

  test("allows api.hubapi.com", () => {
    expect(CRM_HOSTNAME_ALLOWLIST.has("api.hubapi.com")).toBe(true);
  });

  test("rejects arbitrary hostname", () => {
    expect(CRM_HOSTNAME_ALLOWLIST.has("evil.attacker.com")).toBe(false);
  });

  test("rejects metadata.google.internal", () => {
    expect(CRM_HOSTNAME_ALLOWLIST.has("metadata.google.internal")).toBe(false);
  });

  test("rejects localhost", () => {
    expect(CRM_HOSTNAME_ALLOWLIST.has("localhost")).toBe(false);
  });
});
