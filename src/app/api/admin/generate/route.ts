import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { runOnce } from "@/lib/judge";
import { FLAG_RE } from "@/lib/problems";

/** Runs the reference solution on the given inputs and returns its outputs. Instructor only. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    solution?: string;
    harness?: string | null;
    inputs?: string[];
    timeLimitMs?: number;
    extraFlags?: string[];
  } | null;

  if (!body || typeof body.solution !== "string" || !Array.isArray(body.inputs)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const harness = typeof body.harness === "string" && body.harness.trim() ? body.harness : null;
  const timeLimitMs = typeof body.timeLimitMs === "number" && body.timeLimitMs > 0 ? body.timeLimitMs : 2000;

  const extraFlags = Array.isArray(body.extraFlags) ? body.extraFlags.filter((f) => typeof f === "string" && FLAG_RE.test(f)) : [];
  const r = await runOnce({ code: body.solution, harness, extraFlags }, body.inputs, timeLimitMs);
  return NextResponse.json(r);
}
