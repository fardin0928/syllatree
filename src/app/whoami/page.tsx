import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { listAllProblems, readReferenceSolution, getProblem, visibilityState } from "@/lib/problems";
import { TOPICS } from "@/data/roadmap";
import { importReferenceSolution, removeProblem, setPublished, setSolutionPublished } from "./actions";

const STATE_STYLE = {
  live: "bg-emerald-400/10 text-emerald-400",
  scheduled: "bg-amber-400/10 text-amber-300",
  draft: "bg-white/5 text-neutral-400",
} as const;

export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/whoami/login");
  const metas = await listAllProblems();
  const topicTitle = Object.fromEntries(TOPICS.map((t) => [t.id, t.title]));
  const rows = await Promise.all(
    metas.map(async (m) => {
      const [full, ref] = await Promise.all([getProblem(m.slug), readReferenceSolution(m.slug)]);
      return { ...m, hasSolution: full?.solution != null, hasReference: ref !== null, state: visibilityState(m) };
    }),
  );
  const live = rows.filter((r) => r.state === "live").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Problem bank</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {live} of {rows.length} visible to students. Switches apply immediately, no rebuild needed.
          </p>
        </div>
        <Link href="/whoami/new" className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400">
          + New problem
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-[#141414] text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-2 py-3 font-medium">Topic</th>
              <th className="px-2 py-3 font-medium">Visibility</th>
              <th className="px-2 py-3 font-medium">Solution</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.slug} className="border-t border-neutral-800 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{p.title}</div>
                  <div className="font-mono text-xs text-neutral-500">{p.slug} · {p.difficulty}</div>
                </td>
                <td className="px-2 py-3 text-neutral-400">{topicTitle[p.topic] ?? p.topic}</td>

                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLE[p.state]}`}>
                      {p.state === "scheduled" ? `scheduled ${fmt(p.publishAt)}` : p.state}
                    </span>
                    <form action={setPublished}>
                      <input type="hidden" name="slug" value={p.slug} />
                      <input type="hidden" name="published" value={p.published ? "false" : "true"} />
                      <button className="text-xs text-indigo-300 hover:text-indigo-200">
                        {p.published ? "unpublish" : "publish now"}
                      </button>
                    </form>
                  </div>
                </td>

                <td className="px-2 py-3">
                  {p.hasSolution ? (
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.solutionPublished ? STATE_STYLE.live : STATE_STYLE.draft}`}>
                        {p.solutionPublished ? "shown to students" : "hidden"}
                      </span>
                      <form action={setSolutionPublished}>
                        <input type="hidden" name="slug" value={p.slug} />
                        <input type="hidden" name="solutionPublished" value={p.solutionPublished ? "false" : "true"} />
                        <button className="text-xs text-indigo-300 hover:text-indigo-200">
                          {p.solutionPublished ? "hide" : "show"}
                        </button>
                      </form>
                    </div>
                  ) : p.hasReference ? (
                    <form action={importReferenceSolution}>
                      <input type="hidden" name="slug" value={p.slug} />
                      <button className="text-xs text-indigo-300 hover:text-indigo-200" title={`Copies solutions/${p.slug}.cpp into the problem (still hidden until you press show)`}>
                        import from solutions/
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-neutral-600">none</span>
                  )}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/problems/${p.slug}`} className="text-xs text-neutral-400 hover:text-white">
                      {p.state === "live" ? "view" : "preview"}
                    </Link>
                    <Link href={`/whoami/edit/${p.slug}`} className="text-xs text-indigo-300 hover:text-indigo-200">
                      edit
                    </Link>
                    <form action={removeProblem}>
                      <input type="hidden" name="slug" value={p.slug} />
                      <button className="text-xs text-rose-400 hover:text-rose-300">delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No problems yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
