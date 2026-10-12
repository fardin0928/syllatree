"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Difficulty, Topic } from "@/data/roadmap";
import { useProgress } from "@/lib/progress";

const DIFF_COLOR: Record<Difficulty, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};

function CheckCircle({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border transition
        ${done ? "border-emerald-400 bg-emerald-400 text-neutral-900" : "border-neutral-600 text-transparent hover:border-neutral-400"}`}
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
        <path d="M7.6 13.4 4.2 10l1.2-1.2 2.2 2.2 5-5L13.8 7z" />
      </svg>
    </span>
  );
}

function Star({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-[18px] w-[18px] ${on ? "text-amber-400" : "text-neutral-600 hover:text-neutral-400"}`}
      fill={on ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  );
}

export default function TopicSidebar({
  topic,
  onClose,
  localSlugs,
}: {
  topic: Topic | null;
  onClose: () => void;
  /** slugs that exist in problems/ - these open the in-app C++ workspace instead of leetcode.com */
  localSlugs?: Set<string>;
}) {
  const { solved, starred, prereqs, toggleSolved, toggleStarred, togglePrereq } = useProgress();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = topic !== null;
  const total = topic?.problems.length ?? 0;
  const done = topic ? topic.problems.filter((p) => solved.has(`${topic.id}/${p.slug}`)).length : 0;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed right-0 top-0 z-30 flex h-full w-full max-w-[860px] flex-col overflow-y-auto border-l border-neutral-800 bg-[#0a0a0a] transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {topic && (
          <div className="px-8 pb-16 pt-5">
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-2xl leading-none text-neutral-300 transition hover:text-white"
            >
              &times;
            </button>

            <h2 className="mt-2 text-center text-4xl font-semibold text-white">{topic.title}</h2>
            <p className="mt-3 text-center font-mono text-lg text-neutral-200">
              ({done} / {total})
            </p>
            <div className="mx-auto mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${pct}%` }} />
            </div>

            <h3 className="mt-8 text-center text-base font-medium text-neutral-200">Prerequisites</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {topic.prereqs.map((pre) => {
                const id = `${topic.id}/pre/${pre.title}`;
                return (
                  <div
                    key={pre.title}
                    className="rounded-lg border border-neutral-800 bg-black px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold leading-snug text-white">{pre.title}</div>
                      <button
                        onClick={() => togglePrereq(id)}
                        aria-label={`Mark ${pre.title} done`}
                        className={`mt-1 h-4 w-4 shrink-0 rounded border transition
                          ${prereqs.has(id) ? "border-emerald-400 bg-emerald-400" : "border-neutral-600 hover:border-neutral-400"}`}
                      />
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">{pre.course}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-neutral-300">
                    <th className="px-5 py-4 text-left font-medium">Status</th>
                    <th className="px-2 py-4 text-left font-medium">Star</th>
                    <th className="px-2 py-4 text-left font-medium">Problem</th>
                    <th className="px-5 py-4 text-right font-medium">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {topic.problems.map((p) => {
                    const id = `${topic.id}/${p.slug}`;
                    const isDone = solved.has(id);
                    return (
                      <tr key={p.slug} className="border-t border-neutral-800 hover:bg-white/[0.03]">
                        <td className="px-5 py-4">
                          <button onClick={() => toggleSolved(id)} aria-label="Toggle solved">
                            <CheckCircle done={isDone} />
                          </button>
                        </td>
                        <td className="px-2 py-4">
                          <button onClick={() => toggleStarred(id)} aria-label="Toggle star">
                            <Star on={starred.has(id)} />
                          </button>
                        </td>
                        <td className="px-2 py-4">
                          {localSlugs?.has(p.slug) ? (
                            <Link
                              href={`/problems/${p.slug}`}
                              className={`inline-flex items-center gap-2 font-medium transition hover:text-neutral-300 ${isDone ? "text-neutral-400 line-through" : "text-white"}`}
                            >
                              {p.title}
                              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                                C++
                              </span>
                            </Link>
                          ) : (
                            <a
                              href={`https://leetcode.com/problems/${p.slug}/`}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-2 font-medium transition hover:text-neutral-300 ${isDone ? "text-neutral-400 line-through" : "text-white"}`}
                            >
                              {p.title}
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                              </svg>
                            </a>
                          )}
                        </td>
                        <td className={`px-5 py-4 text-right font-mono text-xs font-semibold ${DIFF_COLOR[p.difficulty]}`}>
                          {p.difficulty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
