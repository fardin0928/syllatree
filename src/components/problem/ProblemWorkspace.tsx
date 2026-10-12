"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicProblem } from "@/lib/problems";
import type { JudgeResult, TestResult, Verdict } from "@/lib/judge";
import { TOPICS } from "@/data/roadmap";
import { useProgress } from "@/lib/progress";
import CodeEditor from "./CodeEditor";
import Markdown from "./Markdown";

type RunResponse =
  | (JudgeResult & { mode: "run" | "submit" })
  | { status: "custom"; run: { stdout: string; stderr: string; verdict: "OK" | "TLE" | "RE"; timeMs: number } }
  | { error: string };

type Submission = {
  at: string;
  verdict: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error" | "Compile Error";
  passed: number;
  total: number;
  code: string;
};

const DIFF: Record<PublicProblem["difficulty"], string> = {
  Easy: "text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Hard: "text-rose-400 bg-rose-400/10",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  RE: "Runtime Error",
};
const VERDICT_COLOR: Record<Verdict, string> = {
  AC: "text-emerald-400",
  WA: "text-rose-400",
  TLE: "text-amber-400",
  RE: "text-rose-400",
};

function overallVerdict(results: TestResult[]): Verdict {
  return results.find((r) => r.verdict !== "AC")?.verdict ?? "AC";
}

function storage<T>(key: string, fallback: T): [() => T, (v: T) => void] {
  return [
    () => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    (v: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(v));
      } catch {
        // storage blocked - keep going in memory
      }
    },
  ];
}

export default function ProblemWorkspace({ problem }: { problem: PublicProblem }) {
  const [readCode, writeCode] = useMemo(() => storage<string>(`chill335:code:${problem.slug}`, ""), [problem.slug]);
  const [readSubs, writeSubs] = useMemo(
    () => storage<Submission[]>(`chill335:subs:${problem.slug}`, []),
    [problem.slug],
  );

  const [code, setCode] = useState(problem.starter);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [leftTab, setLeftTab] = useState<"description" | "solution" | "submissions">("description");
  const [bottomTab, setBottomTab] = useState<"tests" | "result">("tests");
  const [activeCase, setActiveCase] = useState(0); // index into publicTests, or -1 for custom
  const [customInput, setCustomInput] = useState(problem.publicTests[0]?.input ?? "");
  const [busy, setBusy] = useState<null | "run" | "submit" | "custom">(null);
  const [response, setResponse] = useState<RunResponse | null>(null);
  const [split, setSplit] = useState(46); // % width of the left pane
  const [vsplit, setVsplit] = useState(62); // % height of the editor within the right pane
  const { solved, markSolved } = useProgress();

  // Hydrate from localStorage after mount so server and first client render match.
  useEffect(() => {
    const saved = readCode();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
    if (saved) setCode(saved);
    setSubs(readSubs());
  }, [readCode, readSubs]);

  const onCodeChange = useCallback(
    (v: string) => {
      setCode(v);
      writeCode(v);
    },
    [writeCode],
  );

  const resetCode = () => {
    if (!window.confirm("Reset the editor to the starter code? Your changes will be lost.")) return;
    onCodeChange(problem.starter);
  };

  const solvedKeys = useMemo(() => {
    const keys = [`problems/${problem.slug}`];
    for (const t of TOPICS) if (t.problems.some((p) => p.slug === problem.slug)) keys.push(`${t.id}/${problem.slug}`);
    return keys;
  }, [problem.slug]);
  const isSolved = solved.has(solvedKeys[0]);

  async function call(body: Record<string, unknown>, kind: "run" | "submit" | "custom") {
    setBusy(kind);
    setBottomTab("result");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: problem.slug, code, ...body }),
      });
      const data = (await res.json()) as RunResponse;
      setResponse(data);
      if (kind === "submit" && !("error" in data) && data.status !== "custom") {
        const sub: Submission = {
          at: new Date().toISOString(),
          verdict:
            data.status === "compile_error"
              ? "Compile Error"
              : (VERDICT_LABEL[overallVerdict(data.results)] as Submission["verdict"]),
          passed: data.status === "done" ? data.passed : 0,
          total: data.status === "done" ? data.total : 0,
          code,
        };
        const next = [sub, ...readSubs()].slice(0, 25);
        writeSubs(next);
        setSubs(next);
        if (sub.verdict === "Accepted") markSolved(solvedKeys);
      }
    } catch (e) {
      setResponse({ error: e instanceof Error ? e.message : "Request failed." });
    } finally {
      setBusy(null);
    }
  }

  // keyboard: Ctrl/Cmd+Enter = run, Ctrl/Cmd+Shift+Enter = submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter" || busy) return;
      e.preventDefault();
      if (e.shiftKey) void call({ mode: "submit" }, "submit");
      else void call({ mode: "run" }, "run");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, code]);

  // --- drag-to-resize -------------------------------------------------------
  const rootRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const startDrag = (axis: "x" | "y") => (e: React.PointerEvent) => {
    e.preventDefault();
    const root = (axis === "x" ? rootRef : rightRef).current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      if (axis === "x") setSplit(clamp(((ev.clientX - rect.left) / rect.width) * 100, 25, 75));
      else setVsplit(clamp(((ev.clientY - rect.top) / rect.height) * 100, 20, 85));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div ref={rootRef} className="flex h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden bg-[#0f0f10] md:flex-row">
      {/* ---------------- left: statement ---------------- */}
      <section
        className="flex min-h-[40dvh] min-w-0 flex-col overflow-hidden border-b border-neutral-800 md:h-full md:min-h-0 md:border-b-0"
        style={{ flexBasis: `${split}%` }}
      >
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-neutral-800 bg-[#141414] px-2">
          <Tab active={leftTab === "description"} onClick={() => setLeftTab("description")}>
            Description
          </Tab>
          {problem.solution !== null && (
            <Tab active={leftTab === "solution"} onClick={() => setLeftTab("solution")}>
              Solution
            </Tab>
          )}
          <Tab active={leftTab === "submissions"} onClick={() => setLeftTab("submissions")}>
            Submissions {subs.length > 0 && <span className="ml-1 text-neutral-500">({subs.length})</span>}
          </Tab>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {leftTab === "description" && (
            <div className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">{problem.title}</h1>
                {isSolved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                      <path d="M7.6 13.4 4.2 10l1.2-1.2 2.2 2.2 5-5L13.8 7z" />
                    </svg>
                    Solved
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 font-medium ${DIFF[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
                {problem.tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-neutral-400">
                    {t}
                  </span>
                ))}
                <span className="ml-auto font-mono text-sm text-neutral-500">time limit {problem.timeLimitMs} ms</span>
              </div>
              <div className="mt-5">
                <Markdown source={problem.description} />
              </div>
            </div>
          )}

          {leftTab === "solution" && problem.solution !== null && (
            <div className="flex h-full flex-col">
              <p className="border-b border-neutral-800 px-6 py-3 text-sm text-neutral-400">
                Instructor&apos;s solution. Compare it with your own attempt.
              </p>
              <div className="min-h-0 flex-1">
                <CodeEditor value={problem.solution} readOnly />
              </div>
            </div>
          )}

          {leftTab === "submissions" && (
            <div className="px-4 py-4">
              {subs.length === 0 ? (
                <p className="px-2 text-sm text-neutral-500">No submissions yet. Press Submit to run all tests.</p>
              ) : (
                <table className="w-full text-[15px]">
                  <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Tests</th>
                      <th className="px-2 py-2 font-medium">When</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s, i) => (
                      <tr key={s.at + i} className="border-t border-neutral-800">
                        <td
                          className={`px-2 py-2 font-medium ${s.verdict === "Accepted" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {s.verdict}
                        </td>
                        <td className="px-2 py-2 font-mono text-neutral-300">
                          {s.total ? `${s.passed}/${s.total}` : "-"}
                        </td>
                        <td className="px-2 py-2 text-neutral-400">{new Date(s.at).toLocaleString()}</td>
                        <td className="px-2 py-2 text-right">
                          <button
                            onClick={() => onCodeChange(s.code)}
                            className="text-xs text-indigo-300 hover:text-indigo-200"
                          >
                            load code
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </section>

      <div
        onPointerDown={startDrag("x")}
        className="hidden w-1.5 shrink-0 cursor-col-resize bg-neutral-900 transition hover:bg-indigo-500/60 md:block"
      />

      {/* ---------------- right: editor + tests ---------------- */}
      <section ref={rightRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-col" style={{ flexBasis: `${vsplit}%` }}>
          <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-neutral-800 bg-[#141414] px-3">
            <div className="flex min-w-0 items-center gap-2 truncate text-sm text-neutral-400">
              <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-neutral-200">C++17</span>
              {problem.hasHarness ? (
                <span className="truncate">complete the starter code; the judge calls it for you</span>
              ) : (
                <span>
                  write a full program with <code className="text-neutral-200">main()</code>, read stdin, print stdout
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={resetCode} className="text-xs text-neutral-400 hover:text-white" title="Reset to starter code">
                Reset
              </button>
              <button
                onClick={() => call({ mode: "run" }, "run")}
                disabled={busy !== null}
                className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                title="Run public tests (Ctrl/Cmd+Enter)"
              >
                {busy === "run" ? "Running…" : "Run"}
              </button>
              <button
                onClick={() => call({ mode: "submit" }, "submit")}
                disabled={busy !== null}
                className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-50"
                title="Run all tests incl. hidden (Ctrl/Cmd+Shift+Enter)"
              >
                {busy === "submit" ? "Judging…" : "Submit"}
              </button>
            </div>
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={onCodeChange} />
          </div>
        </div>

        <div
          onPointerDown={startDrag("y")}
          className="h-1.5 shrink-0 cursor-row-resize bg-neutral-900 transition hover:bg-indigo-500/60"
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-neutral-800 bg-[#141414] px-2">
            <Tab active={bottomTab === "tests"} onClick={() => setBottomTab("tests")}>
              Testcases
            </Tab>
            <Tab active={bottomTab === "result"} onClick={() => setBottomTab("result")}>
              Result
            </Tab>
            <span className="ml-auto pr-2 text-sm text-neutral-500">
              {problem.publicTests.length} public · {problem.hiddenTestCount} hidden
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[15px]">
            {bottomTab === "tests" && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {problem.publicTests.map((t, i) => (
                    <Chip key={t.name} active={activeCase === i} onClick={() => setActiveCase(i)}>
                      Case {i + 1}
                    </Chip>
                  ))}
                  <Chip active={activeCase === -1} onClick={() => setActiveCase(-1)}>
                    + Custom
                  </Chip>
                </div>

                {activeCase >= 0 && problem.publicTests[activeCase] && (
                  <div className="mt-3 grid gap-3">
                    <Field label="Input">
                      <pre className="whitespace-pre-wrap">{problem.publicTests[activeCase].input}</pre>
                    </Field>
                    <Field label="Expected output">
                      <pre className="whitespace-pre-wrap">{problem.publicTests[activeCase].expected}</pre>
                    </Field>
                  </div>
                )}

                {activeCase === -1 && (
                  <div className="mt-3 grid gap-3">
                    {problem.inputFormat && (
                      <p className="whitespace-pre-wrap rounded-md border border-neutral-800 bg-[#141414] px-3 py-2 font-mono text-xs text-neutral-400">
                        {problem.inputFormat}
                      </p>
                    )}
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      spellCheck={false}
                      rows={5}
                      className="w-full resize-y rounded-md border border-neutral-800 bg-[#141414] px-3 py-2 font-mono text-[14.5px] text-neutral-100 outline-none focus:border-indigo-500"
                      placeholder="stdin for your program"
                    />
                    <div>
                      <button
                        onClick={() => call({ mode: "custom", input: customInput }, "custom")}
                        disabled={busy !== null}
                        className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                      >
                        {busy === "custom" ? "Running…" : "Run custom input"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {bottomTab === "result" && <ResultPane response={response} busy={busy} />}
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultPane({ response, busy }: { response: RunResponse | null; busy: string | null }) {
  const [open, setOpen] = useState(0);

  if (busy) return <p className="text-neutral-400">Compiling and running…</p>;
  if (!response) return <p className="text-neutral-500">Run your code to see results here.</p>;
  if ("error" in response) return <p className="text-rose-400">{response.error}</p>;

  if (response.status === "compile_error") {
    return (
      <div>
        <p className="font-semibold text-rose-400">Compile Error</p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-rose-500/30 bg-rose-500/5 p-3 font-mono text-[14px] text-rose-200">
          {response.message}
        </pre>
      </div>
    );
  }

  if (response.status === "custom") {
    const r = response.run;
    return (
      <div className="grid gap-3">
        <p className={`font-semibold ${r.verdict === "OK" ? "text-emerald-400" : "text-rose-400"}`}>
          {r.verdict === "OK" ? "Finished" : VERDICT_LABEL[r.verdict]}{" "}
          <span className="font-mono text-xs font-normal text-neutral-500">{r.timeMs} ms</span>
        </p>
        <Field label="Output">
          <pre className="whitespace-pre-wrap">{r.stdout || <span className="text-neutral-600">(empty)</span>}</pre>
        </Field>
        {r.stderr && (
          <Field label="stderr">
            <pre className="whitespace-pre-wrap text-rose-200">{r.stderr}</pre>
          </Field>
        )}
      </div>
    );
  }

  const verdict = overallVerdict(response.results);
  const sel = response.results[Math.min(open, response.results.length - 1)];
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <p className={`text-xl font-semibold ${VERDICT_COLOR[verdict]}`}>{VERDICT_LABEL[verdict]}</p>
        <span className="font-mono text-sm text-neutral-400">
          {response.passed}/{response.total} tests passed
          {response.mode === "run" && " (public only)"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {response.results.map((r, i) => (
          <Chip key={r.name} active={i === open} onClick={() => setOpen(i)}>
            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${r.verdict === "AC" ? "bg-emerald-400" : "bg-rose-400"}`} />
            {r.isPublic ? `Case ${i + 1}` : `Hidden ${i + 1 - response.results.filter((x) => x.isPublic).length}`}
          </Chip>
        ))}
      </div>

      {sel && (
        <div className="mt-3 grid gap-3">
          <p className={`font-medium ${VERDICT_COLOR[sel.verdict]}`}>
            {VERDICT_LABEL[sel.verdict]} <span className="font-mono text-xs text-neutral-500">{sel.timeMs} ms</span>
          </p>
          {sel.isPublic ? (
            <>
              <Field label="Input">
                <pre className="whitespace-pre-wrap">{sel.input}</pre>
              </Field>
              <Field label="Your output">
                <pre className="whitespace-pre-wrap">{sel.actual || <span className="text-neutral-600">(empty)</span>}</pre>
              </Field>
              <Field label="Expected">
                <pre className="whitespace-pre-wrap">{sel.expected}</pre>
              </Field>
              {sel.stderr && (
                <Field label="stderr">
                  <pre className="whitespace-pre-wrap text-rose-200">{sel.stderr}</pre>
                </Field>
              )}
            </>
          ) : (
            <p className="text-xs text-neutral-500">
              Hidden test: input and expected output are not shown.
              {sel.stderr && <pre className="mt-2 whitespace-pre-wrap text-rose-200">{sel.stderr}</pre>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-[15px] transition ${active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-white/15 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm text-neutral-500">{label}</p>
      <div className="rounded-md border border-neutral-800 bg-[#141414] px-3 py-2 font-mono text-[14.5px] text-neutral-100">
        {children}
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function BackLink() {
  return (
    <Link href="/problems" className="text-xs text-neutral-400 hover:text-white">
      ← Problem list
    </Link>
  );
}
