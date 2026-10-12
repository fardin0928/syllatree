"use client";

import { useMemo } from "react";
import { COURSE_EVENTS, KIND_STYLE } from "@/data/events";
import { useNow } from "@/lib/clock";

const pad = (n: number) => String(n).padStart(2, "0");

function countdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return days > 0
    ? `${days}d ${pad(h)}:${pad(m)}:${pad(sec)}`
    : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function UpcomingPanel() {
  const now = useNow();

  const upcoming = useMemo(() => {
    const sorted = [...COURSE_EVENTS].sort((a, b) => a.at.localeCompare(b.at));
    const future = now === 0 ? sorted : sorted.filter((e) => new Date(e.at).getTime() > now);
    return future.slice(0, 3); // nearest three only
  }, [now]);

  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-[#0a0a0a]/95 p-5 backdrop-blur">
      <h2 className="text-sm font-semibold tracking-wide text-white">Upcoming</h2>

      {next ? (
        <div className="mt-4 rounded-xl border border-neutral-900 bg-black p-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${KIND_STYLE[next.kind].dot}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${KIND_STYLE[next.kind].text}`}>
              {next.kind}
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{next.title}</div>
          <div className="text-xs text-neutral-300">{next.course}</div>
          <div className="mt-3 font-mono text-2xl text-white">
            {now === 0 ? "--:--:--" : countdown(new Date(next.at).getTime() - now)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-300">
            <span>{fmtDate(next.at)}</span>
            {next.location && <span>{next.location}</span>}
          </div>
          {next.note && <div className="mt-1 text-[11px] text-neutral-400">{next.note}</div>}
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-400">Nothing scheduled.</p>
      )}

      {rest.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rest.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-900 bg-black px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE[e.kind].dot}`} />
                  <span className="truncate text-sm text-white">{e.title}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-400">
                  {fmtDate(e.at)}
                  {e.note && <span className="text-neutral-500"> · {e.note}</span>}
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs font-medium text-neutral-300">
                {now === 0 ? "--" : countdown(new Date(e.at).getTime() - now).split(" ")[0]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
