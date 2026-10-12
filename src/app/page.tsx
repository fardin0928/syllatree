import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { LINKS, TOPICS, TOPIC_BY_ID, type Topic } from "@/data/roadmap";
import { listProblems } from "@/lib/problems";

export const dynamic = "force-dynamic";

// The spine is every topic that leads somewhere; leaves hang off it as sub-topics.
const PARENTS = new Set(LINKS.map(([from]) => from));
const SPINE: Topic[] = TOPICS.filter((t) => PARENTS.has(t.id));
const childrenOf = (id: string) =>
  LINKS.filter(([from, to]) => from === id && !PARENTS.has(to)).map(([, to]) => TOPIC_BY_ID.get(to)!);

/** What a spine topic covers: its sub-topics, or its concept groups when it has none. */
function coverage(t: Topic): string[] {
  const kids = childrenOf(t.id).map((k) => k.title);
  return kids.length ? kids : [...new Set(t.prereqs.map((p) => p.course))];
}

// Real starter from problems/iter-erase-evens/starter.cpp.
const SNIPPET = {
  file: "iter-erase-evens / starter.cpp",
  lines: [
    "#include <vector>",
    "",
    "// Remove every even element in place. Walk with an iterator;",
    "// use the value erase() returns.",
    "void eraseEvens(std::vector<int>& v) {",
    "    ",
    "}",
  ],
};

const STEPS: [string, string, string][] = [
  ["01", "Pick a topic", "Follow the roadmap from C++ foundations down to dynamic programming. Each topic lists the concepts to know first."],
  ["02", "Write C++ in the browser", "Open a problem and start from the starter code. Nothing to install."],
  ["03", "Run, then Submit", "Run checks the sample tests and shows your output next to the expected one. Submit runs the hidden tests too."],
  ["04", "Watch the roadmap fill in", "Solved problems are saved in your browser and counted on the roadmap."],
];

const PILL = "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition";
const PILL_LIGHT = `${PILL} bg-white text-black hover:bg-neutral-200`;
const PILL_DARK = `${PILL} border border-neutral-800 bg-black text-white hover:border-neutral-600`;
const EYEBROW = "text-sm text-neutral-500";

function CodeLine({ text }: { text: string }) {
  if (text.trimStart().startsWith("//")) return <span className="text-neutral-500">{text}</span>;
  if (text.startsWith("#")) return <span className="text-neutral-400">{text}</span>;
  return (
    <>
      {text.split(/(\bvoid\b|\bint\b)/).map((part, i) =>
        part === "void" || part === "int" ? (
          <span key={i} className="text-white">{part}</span>
        ) : (
          <span key={i} className="text-neutral-300">{part}</span>
        ),
      )}
    </>
  );
}

/** A small tree drawn in black, lit from behind - the roadmap's mark. */
function GlowTree() {
  return (
    <div className="relative flex h-[320px] items-center justify-center" aria-hidden="true">
      <div className="absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.05)_35%,transparent_68%)]" />
      <svg
        viewBox="0 0 160 140"
        className="relative w-[170px] [filter:drop-shadow(0_0_2px_rgba(255,255,255,0.95))_drop-shadow(0_0_18px_rgba(255,255,255,0.55))_drop-shadow(0_0_44px_rgba(255,255,255,0.25))]"
      >
        <g stroke="black" strokeWidth="7" strokeLinecap="round">
          <line x1="80" y1="22" x2="36" y2="82" />
          <line x1="80" y1="22" x2="124" y2="82" />
          <line x1="36" y1="82" x2="20" y2="122" />
          <line x1="36" y1="82" x2="56" y2="122" />
          <line x1="124" y1="82" x2="140" y2="122" />
        </g>
        <g fill="black">
          <circle cx="80" cy="22" r="17" />
          <circle cx="36" cy="82" r="14" />
          <circle cx="124" cy="82" r="14" />
          <circle cx="20" cy="122" r="11" />
          <circle cx="56" cy="122" r="11" />
          <circle cx="140" cy="122" r="11" />
        </g>
      </svg>
    </div>
  );
}

export default async function Home() {
  const inBrowser = (await listProblems()).length;

  const stats = [
    { n: TOPICS.length, label: "topics on the roadmap" },
    { n: TOPICS.reduce((n, t) => n + t.prereqs.length, 0), label: "concepts to learn" },
    { n: inBrowser, label: "problems you can run here" },
    { n: "C++17", label: "compiled and judged on the server" },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight">
            chill335
          </Link>
          <nav aria-label="Primary" className="hidden gap-6 text-sm text-neutral-400 sm:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#topics" className="transition hover:text-white">Topics</a>
            <Link href="/problems" className="transition hover:text-white">Problems</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AuthButton callbackUrl="/" />
            <Link href="/roadmap" className={`${PILL_LIGHT} px-3 py-1.5 text-xs`}>
              Open roadmap
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* HERO */}
        <section className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <h1 className="text-5xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Data Structures,
              <br />
              Step by Step
            </h1>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/roadmap" className={PILL_LIGHT}>Open the roadmap</Link>
              <Link href="/problems" className={PILL_DARK}>Browse problems</Link>
            </div>
          </div>
          <GlowTree />
          <ul className="flex flex-col gap-2 text-sm text-neutral-300 lg:justify-self-end">
            <li>For CSCI 335 students</li>
            <li>C++ judged right in the browser</li>
            <li>No install, no account needed</li>
          </ul>
        </section>

        {/* TOPIC STRIP — the spine, in course order */}
        <section aria-label="Roadmap topics" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <ul className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 text-lg font-medium tracking-tight text-neutral-400">
            {SPINE.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </section>

        {/* STATS */}
        <section aria-label="What is in it today" className="border-y border-neutral-900">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-neutral-900 px-4 py-10 sm:px-6 md:border-l md:first:border-l-0">
                <dt className="text-3xl font-normal tracking-tight">{s.n}</dt>
                <dd className="mt-1 text-sm text-neutral-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* HOW IT WORKS + CODE */}
        <section id="how" className="mx-auto grid max-w-6xl scroll-mt-16 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <p className={EYEBROW}>How it works</p>
            <h2 className="mt-3 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">Read, write, run, submit.</h2>
            <ol className="mt-10 flex flex-col gap-7">
              {STEPS.map(([n, title, body]) => (
                <li key={n} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                  <span className="font-mono text-sm text-neutral-600">{n}</span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <figure className="self-center overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <figcaption className="border-b border-neutral-800 px-4 py-3 font-mono text-xs text-neutral-500">
              {SNIPPET.file}
            </figcaption>
            <pre className="overflow-x-auto px-4 py-5 font-mono text-[13px] leading-6">
              <code>
                {SNIPPET.lines.map((ln, i) => (
                  <span key={i} className="block">
                    <span aria-hidden="true" className="mr-4 inline-block w-4 select-none text-right text-neutral-700">
                      {i + 1}
                    </span>
                    <CodeLine text={ln} />
                  </span>
                ))}
              </code>
            </pre>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-500">Run checks the samples. Submit adds the hidden tests.</p>
              <Link href="/problems/iter-erase-evens" className={`${PILL_LIGHT} shrink-0 px-3 py-1 text-xs`}>
                Try it
              </Link>
            </div>
          </figure>
        </section>

        {/* TOPICS */}
        <section id="topics" className="scroll-mt-16 border-t border-neutral-900">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <p className={EYEBROW}>Topics</p>
            <h2 className="mt-3 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">From the STL to dynamic programming.</h2>
            <p className="mt-3 max-w-2xl text-neutral-400">
              In the order the course builds on itself. Each topic lists what to know first and the problems to practise
              on.
            </p>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-neutral-900 bg-neutral-900 sm:grid-cols-2 lg:grid-cols-3">
              {SPINE.map((t, i) => (
                <li key={t.id} className="bg-black p-6 transition hover:bg-[#0a0a0a]">
                  <span className="font-mono text-xs text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 font-medium">{t.title}</h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {coverage(t).map((c) => (
                      <li key={c} className="rounded-full border border-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
                        {c}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CLOSING */}
        <section className="relative overflow-hidden border-t border-neutral-900">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-full h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.10),transparent_65%)]"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
            <h2 className="text-4xl font-normal tracking-[-0.04em] sm:text-5xl">Open the roadmap and pick a topic.</h2>
            <p className="mt-4 text-neutral-400">
              {inBrowser} problems are ready to run. Nothing to install, and you can skip the account.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              <Link href="/roadmap" className={PILL_LIGHT}>Open the roadmap</Link>
              <Link href="/problems" className={PILL_DARK}>Browse problems</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-neutral-500 sm:px-6">
          <span className="font-semibold text-white">chill335</span>
          <p>Built by a CS student, in the open.</p>
          <ul className="ml-auto flex gap-5">
            <li><Link href="/roadmap" className="transition hover:text-white">Roadmap</Link></li>
            <li><Link href="/problems" className="transition hover:text-white">Problems</Link></li>
            <li><a href="https://github.com/fardin0928/syllatree" className="transition hover:text-white">Source</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
