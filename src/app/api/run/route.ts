import { NextResponse } from "next/server";
import { getProblem, isVisible } from "@/lib/problems";
import { isAdminRequest } from "@/lib/admin";
import { judge, runOnce } from "@/lib/judge";

const MAX_CODE_BYTES = 256 * 1024;

type Body =
  | { slug: string; code: string; mode: "run" | "submit" }
  | { slug: string; code: string; mode: "custom"; input: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.code !== "string" || Buffer.byteLength(body.code) > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "Code missing or too large." }, { status: 400 });
  }

  const problem = await getProblem(body.slug);
  if (!problem || (!isVisible(problem) && !isAdminRequest(req))) {
    return NextResponse.json({ error: "Unknown problem." }, { status: 404 });
  }

  const target = { code: body.code, harness: problem.harness, extraFlags: problem.extraFlags };

  if (body.mode === "custom") {
    if (typeof body.input !== "string") {
      return NextResponse.json({ error: "Missing input." }, { status: 400 });
    }
    const r = await runOnce(target, [body.input], problem.timeLimitMs);
    if (r.status === "compile_error") return NextResponse.json(r);
    return NextResponse.json({ status: "custom", run: r.runs[0] });
  }

  const tests = body.mode === "run" ? problem.tests.filter((t) => t.isPublic) : problem.tests;
  if (tests.length === 0) {
    return NextResponse.json({ error: "This problem has no test cases yet." }, { status: 400 });
  }
  const result = await judge(target, tests, problem.timeLimitMs);
  return NextResponse.json({ ...result, mode: body.mode });
}
