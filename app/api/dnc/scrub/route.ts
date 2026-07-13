import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { validateE164 } from "@/lib/validate";
import { checkRateLimit } from "@/lib/rate-limit";
import { DncScrubRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = (await request.json()) as DncScrubRequest;
    const { phone_numbers } = body;

    if (!Array.isArray(phone_numbers)) {
      return NextResponse.json(
        { code: 400, message: "phone_numbers must be an array" },
        { status: 400 }
      );
    }

    if (phone_numbers.length > 1000) {
      return NextResponse.json(
        { code: 400, message: "Maximum 1000 phone numbers per request" },
        { status: 400 }
      );
    }

    const invalidNumbers: string[] = [];
    for (const phone of phone_numbers) {
      if (!validateE164(phone)) {
        invalidNumbers.push(phone);
      }
    }

    if (invalidNumbers.length > 0) {
      return NextResponse.json(
        { code: 400, message: "Invalid E.164 phone numbers", errors: invalidNumbers },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    // Single query. PostgREST translates the `in` filter to a
    // `WHERE phone_number = ANY($1)` bound-parameter predicate on the wire,
    // which is exactly the SQL contract in the spec.
    const { data, error } = await supabase
      .from("dnc_list")
      .select("phone_number")
      .in("phone_number", phone_numbers);

    if (error) throw error;

    // Supabase types `data` as `T[] | null`; strict mode does not narrow it
    // after the error guard, so default to an empty array before mapping.
    const blocked = (data ?? []).map((entry) => entry.phone_number);
    const clean = phone_numbers.filter((phone) => !blocked.includes(phone));

    return NextResponse.json({ clean, blocked });
  } catch (error) {
    return errorResponse(error);
  }
}
