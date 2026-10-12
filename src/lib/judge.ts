import "server-only";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export type Verdict = "AC" | "WA" | "TLE" | "RE";

export type TestResult = {
  name: string;
  isPublic: boolean;
  verdict: Verdict;
  timeMs: number;
  /** Only filled for public tests (or custom input). */
  input?: string;
  expected?: string;
  actual?: string;
  stderr?: string;
};

export type JudgeResult =
  | { status: "compile_error"; message: string }
  | { status: "done"; results: TestResult[]; passed: number; total: number };

const COMPILER = process.env.CXX ?? "clang++";
// -Werror=return-type: a function that falls off the end without returning is UB and,
// at -O2, usually turns into an infinite loop / garbage. Make it a clear compile error instead.
const CXXFLAGS = (process.env.CXXFLAGS ?? "-std=c++17 -O2 -Wall -Werror=return-type")
  .split(/\s+/)
  .filter(Boolean);
const COMPILE_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 4 << 20; // 4 MiB per stream
const MAX_INPUT_BYTES = 8 << 20;

type ProcResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  outputExceeded: boolean;
  timeMs: number;
};

function runProcess(
  cmd: string,
  args: string[],
  opts: { cwd: string; input?: string; timeoutMs: number },
): Promise<ProcResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: "pipe",
      env: { ...process.env, HOME: opts.cwd },
    });

    let stdout = "";
    let stderr = "";
    let outBytes = 0;
    let errBytes = 0;
    let timedOut = false;
    let outputExceeded = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, opts.timeoutMs);

    child.stdout.on("data", (d: Buffer) => {
      outBytes += d.length;
      if (outBytes <= MAX_OUTPUT_BYTES) stdout += d.toString("utf8");
      else {
        outputExceeded = true;
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (d: Buffer) => {
      errBytes += d.length;
      if (errBytes <= MAX_OUTPUT_BYTES) stderr += d.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr + `\n${err.message}`,
        code: null,
        signal: null,
        timedOut,
        outputExceeded,
        timeMs: performance.now() - started,
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, signal, timedOut, outputExceeded, timeMs: performance.now() - started });
    });

    child.stdin.on("error", () => {
      // program exited before consuming all of stdin - not our problem
    });
    if (opts.input !== undefined) child.stdin.write(opts.input);
    child.stdin.end();
  });
}

/** Normalises output so trailing spaces / blank lines / CRLF do not matter. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

export type CompileTarget = {
  /** Student (or reference) code. Written to solution.cpp. */
  code: string;
  /** Optional harness that #includes "solution.cpp". */
  harness: string | null;
  /** Per-problem extra compiler flags (already validated by the problem store). */
  extraFlags?: string[];
};

type Compiled = { dir: string; bin: string; cleanup: () => Promise<void> };

async function compile(
  target: CompileTarget,
): Promise<{ ok: true; compiled: Compiled } | { ok: false; message: string }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "chill335-judge-"));
  const cleanup = () => fs.rm(dir, { recursive: true, force: true });

  await fs.writeFile(path.join(dir, "solution.cpp"), target.code);
  let entry = "solution.cpp";
  if (target.harness !== null) {
    await fs.writeFile(path.join(dir, "harness.cpp"), target.harness);
    entry = "harness.cpp";
  }

  const bin = path.join(dir, "main");
  const res = await runProcess(COMPILER, [...CXXFLAGS, ...(target.extraFlags ?? []), entry, "-o", bin], {
    cwd: dir,
    timeoutMs: COMPILE_TIMEOUT_MS,
  });

  if (res.timedOut) {
    await cleanup();
    return { ok: false, message: "Compilation timed out." };
  }
  if (res.code !== 0) {
    await cleanup();
    const msg = (res.stderr || res.stdout || "Compiler failed with no output.")
      // hide the temp dir path so students see `solution.cpp:12:5` not `/tmp/xyz/solution.cpp:12:5`
      .split(dir + path.sep)
      .join("");
    return { ok: false, message: msg };
  }
  return { ok: true, compiled: { dir, bin, cleanup } };
}

export type JudgeTest = { name: string; input: string; expected: string; isPublic: boolean };

/**
 * Compile once, run every test. Public tests carry full I/O in the result,
 * hidden ones only a verdict.
 */
export async function judge(
  target: CompileTarget,
  tests: JudgeTest[],
  timeLimitMs: number,
): Promise<JudgeResult> {
  const c = await compile(target);
  if (!c.ok) return { status: "compile_error", message: c.message };
  const { dir, bin, cleanup } = c.compiled;

  try {
    const results: TestResult[] = [];
    for (const t of tests) {
      if (Buffer.byteLength(t.input) > MAX_INPUT_BYTES) {
        results.push({ name: t.name, isPublic: t.isPublic, verdict: "RE", timeMs: 0, stderr: "Input too large." });
        continue;
      }
      const r = await runProcess(bin, [], { cwd: dir, input: t.input, timeoutMs: timeLimitMs });
      let verdict: Verdict;
      if (r.timedOut) verdict = "TLE";
      else if (r.code !== 0) verdict = "RE";
      else verdict = normalizeOutput(r.stdout) === normalizeOutput(t.expected) ? "AC" : "WA";

      const base: TestResult = { name: t.name, isPublic: t.isPublic, verdict, timeMs: Math.round(r.timeMs) };
      if (t.isPublic) {
        base.input = t.input;
        base.expected = t.expected;
        base.actual = r.stdout;
        base.stderr = describeExit(r);
      } else if (verdict === "RE") {
        base.stderr = describeExit(r);
      }
      results.push(base);
    }
    const passed = results.filter((r) => r.verdict === "AC").length;
    return { status: "done", results, passed, total: results.length };
  } finally {
    await cleanup();
  }
}

/** Run once on arbitrary stdin (no expected output). Used for custom input + expected-output generation. */
export async function runOnce(
  target: CompileTarget,
  inputs: string[],
  timeLimitMs: number,
): Promise<
  | { status: "compile_error"; message: string }
  | { status: "done"; runs: { stdout: string; stderr: string; verdict: Exclude<Verdict, "AC" | "WA">| "OK"; timeMs: number }[] }
> {
  const c = await compile(target);
  if (!c.ok) return { status: "compile_error", message: c.message };
  const { dir, bin, cleanup } = c.compiled;
  try {
    const runs = [];
    for (const input of inputs) {
      const r = await runProcess(bin, [], { cwd: dir, input, timeoutMs: timeLimitMs });
      runs.push({
        stdout: r.stdout,
        stderr: describeExit(r),
        verdict: r.timedOut ? ("TLE" as const) : r.code !== 0 ? ("RE" as const) : ("OK" as const),
        timeMs: Math.round(r.timeMs),
      });
    }
    return { status: "done", runs };
  } finally {
    await cleanup();
  }
}

function describeExit(r: ProcResult): string {
  const parts: string[] = [];
  if (r.stderr.trim()) parts.push(r.stderr.trim());
  if (r.timedOut) parts.push("Killed: time limit exceeded.");
  else if (r.outputExceeded) parts.push(`Killed: output limit exceeded (${MAX_OUTPUT_BYTES >> 20} MiB). Infinite print loop?`);
  else if (r.signal) parts.push(`Killed by signal ${r.signal}${r.signal === "SIGSEGV" ? " (segmentation fault)" : ""}.`);
  else if (r.code !== null && r.code !== 0) parts.push(`Exited with code ${r.code}.`);
  return parts.join("\n");
}
