/**
 * Tests for leads API ownership / IDOR protection
 * Ticket: 5f1af61a-db5a-4ca0-b419-c7dc860152a8
 */

const USER_A = "user-a"
const USER_B = "user-b"
const LEAD_ID = "lead-owned-by-a"

// Mock requireAuth
jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(),
}))

// Mock Supabase server client
jest.mock("@/lib/supabase-server", () => ({
  createServerClient: jest.fn(),
}))

import { requireAuth } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase-server"
import { GET as getById, PATCH } from "@/app/api/leads/[lead_id]/route"
import { GET as getList } from "@/app/api/leads/route"

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

function buildRequest(method = "GET", body?: unknown): Request {
  return new Request("http://localhost/api/leads/" + LEAD_ID, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  })
}

function buildListRequest(): Request {
  return new Request("http://localhost/api/leads", { method: "GET" })
}

function buildSupabaseMock(returnData: unknown, returnError: unknown = null) {
  const single = jest.fn().mockResolvedValue({ data: returnData, error: returnError })
  const range = jest.fn().mockReturnThis()
  const order = jest.fn().mockResolvedValue({ data: returnData ? [returnData] : [], error: returnError, count: returnData ? 1 : 0 })
  const eq = jest.fn().mockReturnThis()
  const select = jest.fn().mockReturnThis()
  const update = jest.fn().mockReturnThis()
  const from = jest.fn().mockReturnValue({ select, eq, single, update, range, order })
  return { from } as unknown as ReturnType<typeof createServerClient>
}

describe("GET /api/leads/[lead_id] — ownership check", () => {
  it("returns 404 when user B requests a lead owned by user A", async () => {
    // User B is authenticated
    mockRequireAuth.mockResolvedValue({ userId: USER_B, role: null } as never)

    // Supabase returns no data (ownership filter applied at DB level)
    const client = buildSupabaseMock(null, { code: "PGRST116" })
    mockCreateServerClient.mockReturnValue(client)

    const res = await getById(buildRequest(), { params: { lead_id: LEAD_ID } })
    expect(res.status).toBe(404)
  })

  it("returns 200 when user A requests their own lead", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_A, role: null } as never)

    const lead = { id: LEAD_ID, owner_id: USER_A, status: "not_called" }
    const client = buildSupabaseMock(lead)
    mockCreateServerClient.mockReturnValue(client)

    const res = await getById(buildRequest(), { params: { lead_id: LEAD_ID } })
    expect(res.status).toBe(200)
  })

  it("admin can read any lead regardless of owner", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_B, role: "admin" } as never)

    const lead = { id: LEAD_ID, owner_id: USER_A, status: "not_called" }
    const client = buildSupabaseMock(lead)
    mockCreateServerClient.mockReturnValue(client)

    const res = await getById(buildRequest(), { params: { lead_id: LEAD_ID } })
    expect(res.status).toBe(200)
  })
})

describe("PATCH /api/leads/[lead_id] — ownership check", () => {
  it("returns 403 when user B tries to mutate a lead owned by user A", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_B, role: null } as never)

    // First select (ownership check) returns lead owned by A
    const existingLead = { id: LEAD_ID, owner_id: USER_A }
    const single = jest.fn().mockResolvedValue({ data: existingLead, error: null })
    const eq = jest.fn().mockReturnThis()
    const select = jest.fn().mockReturnThis()
    const from = jest.fn().mockReturnValue({ select, eq, single })
    mockCreateServerClient.mockReturnValue({ from } as unknown as ReturnType<typeof createServerClient>)

    const res = await PATCH(buildRequest("PATCH", { status: "called" }), { params: { lead_id: LEAD_ID } })
    expect(res.status).toBe(403)
  })

  it("returns 200 when user A mutates their own lead", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_A, role: null } as never)

    const existingLead = { id: LEAD_ID, owner_id: USER_A }
    const updatedLead = { id: LEAD_ID, owner_id: USER_A, status: "called" }

    let callCount = 0
    const single = jest.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve({ data: existingLead, error: null })
      return Promise.resolve({ data: updatedLead, error: null })
    })
    const eq = jest.fn().mockReturnThis()
    const select = jest.fn().mockReturnThis()
    const update = jest.fn().mockReturnThis()
    const from = jest.fn().mockReturnValue({ select, eq, single, update })
    mockCreateServerClient.mockReturnValue({ from } as unknown as ReturnType<typeof createServerClient>)

    const res = await PATCH(buildRequest("PATCH", { status: "called" }), { params: { lead_id: LEAD_ID } })
    expect(res.status).toBe(200)
  })
})

describe("GET /api/leads — list scoping", () => {
  it("non-admin user sees only their own leads", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_A, role: null } as never)

    const ownLead = { id: LEAD_ID, owner_id: USER_A, status: "not_called" }
    const order = jest.fn().mockResolvedValue({ data: [ownLead], error: null, count: 1 })
    const range = jest.fn().mockReturnThis()
    const eq = jest.fn().mockReturnThis()
    const select = jest.fn().mockReturnThis()
    const from = jest.fn().mockReturnValue({ select, eq, range, order })
    mockCreateServerClient.mockReturnValue({ from } as unknown as ReturnType<typeof createServerClient>)

    const res = await getList(buildListRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.every((l: { owner_id: string }) => l.owner_id === USER_A)).toBe(true)
  })

  it("admin sees all leads", async () => {
    mockRequireAuth.mockResolvedValue({ userId: USER_B, role: "admin" } as never)

    const leads = [
      { id: "lead-1", owner_id: USER_A },
      { id: "lead-2", owner_id: USER_B },
    ]
    const order = jest.fn().mockResolvedValue({ data: leads, error: null, count: 2 })
    const range = jest.fn().mockReturnThis()
    const eq = jest.fn().mockReturnThis()
    const select = jest.fn().mockReturnThis()
    const from = jest.fn().mockReturnValue({ select, eq, range, order })
    mockCreateServerClient.mockReturnValue({ from } as unknown as ReturnType<typeof createServerClient>)

    const res = await getList(buildListRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBe(2)
  })
})
