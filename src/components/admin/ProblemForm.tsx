"use client";

import { useActionState, useState } from "react";
import { saveProblem, type SaveState } from "@/app/whoami/actions";
import CodeEditor from "@/components/problem/CodeEditor";
import Markdown from "@/components/problem/Markdown";

export type FormInitial = {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  tags: string;
  timeLimitMs: number;
  inputFormat: string;
  extraFlags: string;
  order: number;
  published: boolean;
  publishAt: string;
  solutionPublished: boolean;
  description: string;
  starter: string;
  harness: string;
  solution: string;
  tests: { name: string; input: string; expected: string }[];
};

const DEFAULT_STARTER = `#include <vector>
using namespace std;

class Solution {
public:
    int solve(vector<int>& nums) {
        
    }
};
`;

const DEFAULT_HARNESS = `#include <iostream>
#include <vector>
#include "solution.cpp"   // student code is written to this file

int main() {
    int n;
    std::cin >> n;
    std::vector<int> nums(n);
    for (auto& x : nums) std::cin >> x;
    std::cout << Solution().solve(nums) << '\\n';
}
`;

export const EMPTY_INITIAL: FormInitial = {
  slug: "",
  title: "",
  difficulty: "Easy",
  topic: "",
  tags: "",
  timeLimitMs: 2000,
  inputFormat: "Line 1: n\nLine 2: n integers",
  extraFlags: "",
  order: 100,
  published: false,
  publishAt: "",
  solutionPublished: false,
  description: "Describe the problem here. Markdown is supported.\n\n### Example 1\n\n```\nInput: nums = [1,2,3]\nOutput: 6\n```\n\n### Constraints\n\n- `1 <= n <= 10^5`\n",
  starter: DEFAULT_STARTER,
  harness: DEFAULT_HARNESS,
  solution: "",
  tests: [
    { name: "sample1", input: "3\n1 2 3\n", expected: "" },
    { name: "hidden1", input: "", expected: "" },
  ],
};

export default function ProblemForm({
  initial,
  topics,
  isNew,
}: {
  initial: FormInitial;
  topics: { id: string; title: string }[];
  isNew: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProblem, null);
  const [f, setF] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const set = <K extends keyof FormInitial>(k: K, v: FormInitial[K]) => setF((s) => ({ ...s, [k]: v }));
  const setTest = (i: number, patch: Partial<FormInitial["tests"][number]>) =>
    setF((s) => ({ ...s, tests: s.tests.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));

  const addTest = (kind: "sample" | "hidden") => {
    const n = f.tests.filter((t) => t.name.startsWith(kind)).length + 1;
    setF((s) => ({ ...s, tests: [...s.tests, { name: `${kind}${n}`, input: "", expected: "" }] }));
  };

  async function generateOutputs() {
    if (!f.solution.trim()) {
      setGenMsg("Paste a reference solution first.");
      return;
    }
    setGenBusy(true);
    setGenMsg(null);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          solution: f.solution,
          harness: f.harness,
          inputs: f.tests.map((t) => t.input),
          timeLimitMs: f.timeLimitMs,
          extraFlags: f.extraFlags.split(/\s+/).filter(Boolean),
        }),
      });
      const data = (await res.json()) as
        | { status: "compile_error"; message: string }
        | { status: "done"; runs: { stdout: string; stderr: string; verdict: string; timeMs: number }[] }
        | { error: string };
      if ("error" in data) setGenMsg(data.error);
      else if (data.status === "compile_error") setGenMsg("Reference solution failed to compile:\n" + data.message);
      else {
        const bad = data.runs.map((r, i) => (r.verdict === "OK" ? null : `${f.tests[i].name}: ${r.verdict} ${r.stderr}`)).filter(Boolean);
        setF((s) => ({
          ...s,
          tests: s.tests.map((t, i) => (data.runs[i].verdict === "OK" ? { ...t, expected: data.runs[i].stdout } : t)),
        }));
        setGenMsg(bad.length ? bad.join("\n") : `Filled expected output for ${data.runs.length} tests.`);
      }
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setGenBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-neutral-800 bg-[#141414] px-3 py-1.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-indigo-500";
  const label = "block text-xs font-medium text-neutral-400 mb-1";

  return (
    <form action={action} className="grid gap-8 pb-24">
      <input type="hidden" name="originalSlug" value={isNew ? "" : initial.slug} />
      <input type="hidden" name="tests" value={JSON.stringify(f.tests)} />
      <input type="hidden" name="description" value={f.description} />
      <input type="hidden" name="starter" value={f.starter} />
      <input type="hidden" name="harness" value={f.harness} />
      <input type="hidden" name="solution" value={f.solution} />

      {/* ---- metadata ---- */}
      <Section title="1. Metadata">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className={label}>Title</label>
            <input name="title" value={f.title} onChange={(e) => set("title", e.target.value)} className={input} required />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Slug (URL: /problems/&lt;slug&gt;)</label>
            <input
              name="slug"
              value={f.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              onBlur={() => !f.slug && set("slug", slugify(f.title))}
              placeholder={slugify(f.title) || "two-sum"}
              className={`${input} font-mono`}
              required
            />
          </div>
          <div>
            <label className={label}>Difficulty</label>
            <select name="difficulty" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value as FormInitial["difficulty"])} className={input}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className={label}>Roadmap topic</label>
            <select name="topic" value={f.topic} onChange={(e) => set("topic", e.target.value)} className={input}>
              <option value="">(none)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Time limit (ms / test)</label>
            <input type="number" name="timeLimitMs" min={100} max={30000} value={f.timeLimitMs} onChange={(e) => set("timeLimitMs", Number(e.target.value))} className={input} />
          </div>
          <div>
            <label className={label}>Sort order</label>
            <input type="number" name="order" value={f.order} onChange={(e) => set("order", Number(e.target.value))} className={input} />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Tags (comma separated)</label>
            <input name="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="array, hash-map" className={input} />
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Input format hint (shown to students for custom input)</label>
            <textarea name="inputFormat" value={f.inputFormat} onChange={(e) => set("inputFormat", e.target.value)} rows={2} className={`${input} font-mono`} />
          </div>
          <div className="rounded-md border border-neutral-800 bg-[#141414] p-3 lg:col-span-4">
            <p className="mb-2 text-xs font-medium text-neutral-400">Visibility to students</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-300">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="published" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
                Published (visible now)
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">or auto-publish at</span>
                <input type="datetime-local" name="publishAt" value={f.publishAt} onChange={(e) => set("publishAt", e.target.value)} className="rounded border border-neutral-800 bg-[#0f0f10] px-2 py-1 text-xs text-white outline-none focus:border-indigo-500" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="solutionPublished" checked={f.solutionPublished} onChange={(e) => set("solutionPublished", e.target.checked)} />
                Show solution tab to students
              </label>
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className={label}>Extra compiler flags (space separated, optional)</label>
            <input name="extraFlags" value={f.extraFlags} onChange={(e) => set("extraFlags", e.target.value)} placeholder="-fsanitize=address -g" className={`${input} font-mono`} />
          </div>
        </div>
      </Section>

      {/* ---- description ---- */}
      <Section
        title="2. Description (Markdown)"
        right={
          <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs text-indigo-300 hover:text-indigo-200">
            {preview ? "Edit" : "Preview"}
          </button>
        }
      >
        {preview ? (
          <div className="rounded-md border border-neutral-800 bg-[#141414] p-5">
            <Markdown source={f.description} />
          </div>
        ) : (
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={16} spellCheck={false} className={`${input} font-mono text-[13px]`} />
        )}
      </Section>

      {/* ---- code ---- */}
      <Section title="3. Starter code (what the student sees)">
        <Editor value={f.starter} onChange={(v) => set("starter", v)} />
      </Section>

      <Section
        title="4. Harness (optional)"
        hint='main() that reads stdin, calls Solution, prints the answer. Must #include "solution.cpp". Leave empty for stdin/stdout problems where the student writes main() themselves.'
      >
        <Editor value={f.harness} onChange={(v) => set("harness", v)} />
      </Section>

      <Section title="5. Solution (optional)" hint='Used to auto-generate expected outputs. Students only see it when "Show solution tab" above is on.'>
        <Editor value={f.solution} onChange={(v) => set("solution", v)} />
      </Section>

      {/* ---- tests ---- */}
      <Section
        title="6. Test cases"
        hint='Names starting with "sample" are public (students see input + expected). Everything else is hidden.'
        right={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => addTest("sample")} className="text-xs text-indigo-300 hover:text-indigo-200">
              + sample
            </button>
            <button type="button" onClick={() => addTest("hidden")} className="text-xs text-indigo-300 hover:text-indigo-200">
              + hidden
            </button>
            <button
              type="button"
              onClick={generateOutputs}
              disabled={genBusy}
              className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
            >
              {genBusy ? "Running…" : "Generate expected outputs from solution"}
            </button>
          </div>
        }
      >
        {genMsg && <pre className="mb-3 whitespace-pre-wrap rounded-md border border-neutral-800 bg-[#141414] p-3 font-mono text-xs text-neutral-300">{genMsg}</pre>}
        <div className="grid gap-3">
          {f.tests.map((t, i) => (
            <div key={i} className="rounded-md border border-neutral-800 bg-[#141414] p-3">
              <div className="flex items-center gap-3">
                <input
                  value={t.name}
                  onChange={(e) => setTest(i, { name: e.target.value })}
                  className="w-40 rounded border border-neutral-800 bg-[#0f0f10] px-2 py-1 font-mono text-xs text-white outline-none focus:border-indigo-500"
                />
                <span className={`text-xs ${t.name.startsWith("sample") ? "text-emerald-400" : "text-neutral-500"}`}>
                  {t.name.startsWith("sample") ? "public" : "hidden"}
                </span>
                <button type="button" onClick={() => setF((s) => ({ ...s, tests: s.tests.filter((_, j) => j !== i) }))} className="ml-auto text-xs text-rose-400 hover:text-rose-300">
                  remove
                </button>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>stdin</label>
                  <textarea value={t.input} onChange={(e) => setTest(i, { input: e.target.value })} rows={4} spellCheck={false} className={`${input} font-mono text-[13px]`} />
                </div>
                <div>
                  <label className={label}>expected stdout</label>
                  <textarea value={t.expected} onChange={(e) => setTest(i, { expected: e.target.value })} rows={4} spellCheck={false} className={`${input} font-mono text-[13px]`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-800 bg-[#141414]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <button type="submit" disabled={pending} className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50">
            {pending ? "Saving…" : isNew ? "Create problem" : "Save changes"}
          </button>
          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
          <p className="ml-auto text-xs text-neutral-500">
            Writes to <code>problems/{f.slug || "<slug>"}/</code>
          </p>
        </div>
      </div>
    </form>
  );
}

function Editor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="h-64 overflow-hidden rounded-md border border-neutral-800">
      <CodeEditor value={value} onChange={onChange} />
    </div>
  );
}

function Section({ title, hint, right, children }: { title: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {right}
      </div>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      {children}
    </section>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
