"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TOPICS, TOTAL_PROBLEMS, type Difficulty } from "@/data/roadmap";
import { useProgress } from "@/lib/progress";

const ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];
const COLOR: Record<Difficulty, { text: string; stroke: string; track: string }> = {
  Easy: { text: "text-emerald-400", stroke: "#34d399", track: "#2f2f2f" },
  Medium: { text: "text-amber-400", stroke: "#fbbf24", track: "#2f2f2f" },
  Hard: { text: "text-rose-400", stroke: "#fb7185", track: "#2f2f2f" },
};

/** Ring spans 270deg; 100 pathLength units = full circle. */
const SPAN = 75;
const GAP = 1.6;

export default function StatsPanel({ authSlot }: { authSlot?: React.ReactNode }) {
  const { solved } = useProgress();

  const stats = useMemo(() => {
    const total: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    const done: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const t of TOPICS) {
      for (const p of t.problems) {
        total[p.difficulty] += 1;
        if (solved.has(`${t.id}/${p.slug}`)) done[p.difficulty] += 1;
      }
    }
    return { total, done };
  }, [solved]);

  const totalDone = ORDER.reduce((n, d) => n + stats.done[d], 0);

  // Each difficulty owns a slice of the ring proportional to its problem count.
  const segments = useMemo(() => {
    const out: { d: Difficulty; start: number; len: number; filled: number }[] = [];
    let cursor = 0;
    for (const d of ORDER) {
      const slice = (stats.total[d] / TOTAL_PROBLEMS) * SPAN;
      const len = Math.max(slice - GAP, 0);
      out.push({
        d,
        start: cursor,
        len,
        filled: stats.total[d] ? (len * stats.done[d]) / stats.total[d] : 0,
      });
      cursor += slice;
    }
    return out;
  }, [stats]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-[#0a0a0a]/95 p-5 backdrop-blur">
      <div className="mb-5 flex flex-col gap-2 border-b border-neutral-800 pb-5">
        {authSlot}
        <Link
          href="/problems"
          className="flex w-full items-center justify-center rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-neutral-500 hover:text-white"
        >
          View all problems
        </Link>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2.5">
          {ORDER.map((d) => (
            <div key={d} className="flex items-baseline gap-6 font-mono text-[15px]">
              <span className={`w-16 font-semibold ${COLOR[d].text}`}>{d}</span>
              <span className="font-semibold text-neutral-100">
                {stats.done[d]}/{stats.total[d]}
              </span>
            </div>
          ))}
        </div>

        <div className="relative h-[124px] w-[124px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-[135deg]">
            {segments.map((s) => (
              <g key={s.d}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  pathLength={100}
                  fill="none"
                  stroke={COLOR[s.d].track}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${s.len} ${100 - s.len}`}
                  strokeDashoffset={-s.start}
                />
                {s.filled > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    pathLength={100}
                    fill="none"
                    stroke={COLOR[s.d].stroke}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${s.filled} ${100 - s.filled}`}
                    strokeDashoffset={-s.start}
                    className="transition-[stroke-dasharray] duration-500"
                  />
                )}
              </g>
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-3xl font-bold text-white">{totalDone}</span>
            <span className="mt-1 font-mono text-[11px] text-neutral-300">/{TOTAL_PROBLEMS}</span>
            <span className="mt-0.5 text-[11px] font-medium text-neutral-300">Solved</span>
          </div>
        </div>
      </div>

    </section>
  );
}
