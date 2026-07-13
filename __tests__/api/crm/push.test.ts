import { POST } from "@/app/api/crm/push/route";
import { NextRequest } from "next/server";

jest.mock("dns", () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

const { lookup } = jest.requireMock("dns").promises;

jest.mock("@/lib/supabase-server", () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: { id: "lead-1" }, error: null })),
        })),
      })),
    })),
  })),
}));

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ allowed: true })),
}));

jest.mock("@/lib/errors", () => ({
  errorResponse: jest.fn((err: Error) => {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }),
  ApiNotFoundError: class extends Error {
    constructor(resource: string, id: string) {
      super(`${resource} not found: ${id}`);
    }
  },
}));

function mockRequest(body: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/crm/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer test-user",
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/crm/push", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks AWS IMDS endpoint", async () => {
    const res = await POST(
      mockRequest({ crm_endpoint: "https://169.254.169.254/latest/meta-data/" })
    );
    expect(res.status).toBe(400);
  });

  it("blocks localhost endpoint", async () => {
    const res = await POST(mockRequest({ crm_endpoint: "https://localhost:6543/" }));
    expect(res.status).toBe(400);
  });

  it("blocks RFC-1918 endpoint", async () => {
    const res = await POST(mockRequest({ crm_endpoint: "https://192.168.1.1/" }));
    expect(res.status).toBe(400);
  });

  it("blocks IPv6 loopback endpoint", async () => {
    const res = await POST(mockRequest({ crm_endpoint: "https://[::1]/" }));
    expect(res.status).toBe(400);
  });

  it("does not echo crm_endpoint in error response", async () => {
    const res = await POST(mockRequest({ crm_endpoint: "https://169.254.169.254/" }));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("169.254.169.254");
  });

  it("allows allowlisted CRM hostname resolving to public IP", async () => {
    (lookup as jest.Mock).mockResolvedValue({ address: "1.2.3.4", family: 4 });
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, status: 200 })
    ) as jest.Mock;

    const res = await POST(
      mockRequest({ crm_endpoint: "https://api.salesforce.com/v1/leads" })
    );
    expect(res.status).toBe(200);
  });
});
