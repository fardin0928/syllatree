"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProblemMeta } from "@/lib/problems";
import { useProgress } from "@/lib/progress";

const DIFF: Record<ProblemMeta["difficulty"], string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};

export default function ProblemsTable({ problems, topicTitles }: { problems: ProblemMeta[]; topicTitles: Record<string, string> }) {
  const { solved } = useProgress();
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<"All" | ProblemMeta["difficulty"]>("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return problems.filter(
      (p) =>
        (diff === "All" || p.difficulty === diff) &&
        (!needle ||
          p.title.toLowerCase().includes(needle) ||
          p.tags.some((t) => t.toLowerCase().includes(needle)) ||
          (topicTitles[p.topic] ?? p.topic).toLowerCase().includes(needle)),
    );
  }, [problems, q, diff, topicTitles]);

  const doneCount = problems.filter((p) => solved.has(`problems/${p.slug}`)).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, tag, topic"
          className="w-64 rounded-md border border-neutral-800 bg-[#141414] px-3 py-1.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-indigo-500"
        />
        <div className="flex gap-1 rounded-md bg-white/5 p-0.5 text-xs">
          {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={`rounded px-2.5 py-1 transition ${diff === d ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-xs text-neutral-500">
          {doneCount}/{problems.length} solved
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-[#141414] text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="w-16 px-4 py-3 font-medium">Status</th>
              <th className="px-2 py-3 font-medium">Title</th>
              <th className="px-2 py-3 font-medium">Topic</th>
              <th className="px-2 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 text-right font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const done = solved.has(`problems/${p.slug}`);
              return (
                <tr key={p.slug} className="border-t border-neutral-800 transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    {done ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-neutral-900" aria-label="Solved">
                        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                          <path d="M7.6 13.4 4.2 10l1.2-1.2 2.2 2.2 5-5L13.8 7z" />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-block h-5 w-5 rounded-full border border-neutral-700" aria-label="Unsolved" />
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/problems/${p.slug}`} className="font-medium text-white hover:text-indigo-300">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-neutral-400">{topicTitles[p.topic] ?? p.topic}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-neutral-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${DIFF[p.difficulty]}`}>{p.difficulty}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  {problems.length === 0 ? (
                    <>
                      No problems posted yet. Check back soon.
                    </>
                  ) : (
                    "Nothing matches."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
