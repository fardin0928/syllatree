import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type ProblemMeta = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  tags: string[];
  timeLimitMs: number;
  inputFormat: string;
  /** Extra compiler flags, e.g. ["-fsanitize=address", "-g"]. Whitelisted to -flag tokens only. */
  extraFlags: string[];
  order: number;
  /** Students see the problem only when published (or once publishAt has passed). */
  published: boolean;
  /** ISO datetime (local). If set and in the future, the problem is "scheduled". */
  publishAt: string | null;
  /** Show solution.cpp to students under a "Solution" tab. */
  solutionPublished: boolean;
};

export type TestCase = {
  name: string;
  input: string;
  expected: string;
  /** name starts with "sample" */
  isPublic: boolean;
};

export type Problem = ProblemMeta & {
  description: string;
  starter: string;
  harness: string | null;
  solution: string | null;
  tests: TestCase[];
};

/** Everything a student's browser is allowed to see. */
export type PublicProblem = ProblemMeta & {
  description: string;
  starter: string;
  hasHarness: boolean;
  /** Only present when the instructor has published it. */
  solution: string | null;
  publicTests: { name: string; input: string; expected: string }[];
  hiddenTestCount: number;
};

export const PROBLEMS_DIR = path.join(process.cwd(), "problems");
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
/** A compiler flag: starts with "-", no spaces or shell metacharacters. */
export const FLAG_RE = /^-[A-Za-z0-9_=+.,\-]+$/;

async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

function coerceMeta(slug: string, raw: unknown): ProblemMeta {
  const r = (raw ?? {}) as Record<string, unknown>;
  const difficulty = DIFFICULTIES.includes(r.difficulty as Difficulty)
    ? (r.difficulty as Difficulty)
    : "Easy";
  return {
    slug,
    title: typeof r.title === "string" && r.title.trim() ? r.title : slug,
    difficulty,
    topic: typeof r.topic === "string" ? r.topic : "",
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : [],
    timeLimitMs:
      typeof r.timeLimitMs === "number" && r.timeLimitMs > 0 ? Math.min(r.timeLimitMs, 30_000) : 2000,
    inputFormat: typeof r.inputFormat === "string" ? r.inputFormat : "",
    extraFlags: Array.isArray(r.extraFlags) ? r.extraFlags.filter((f): f is string => typeof f === "string" && FLAG_RE.test(f)) : [],
    order: typeof r.order === "number" ? r.order : 1_000_000,
    published: r.published === true,
    publishAt: typeof r.publishAt === "string" && r.publishAt ? r.publishAt : null,
    solutionPublished: r.solutionPublished === true,
  };
}

/** Whether students may see this problem right now. */
export function isVisible(meta: Pick<ProblemMeta, "published" | "publishAt">, now = Date.now()): boolean {
  if (meta.published) return true;
  if (meta.publishAt) {
    const t = new Date(meta.publishAt).getTime();
    return Number.isFinite(t) && t <= now;
  }
  return false;
}

export type VisibilityState = "live" | "scheduled" | "draft";
export function visibilityState(meta: Pick<ProblemMeta, "published" | "publishAt">, now = Date.now()): VisibilityState {
  if (isVisible(meta, now)) return "live";
  return meta.publishAt ? "scheduled" : "draft";
}

async function readTests(dir: string): Promise<TestCase[]> {
  let names: string[] = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const ins = names.filter((n) => n.endsWith(".in")).sort(naturalCompare);
  const tests: TestCase[] = [];
  for (const inName of ins) {
    const name = inName.slice(0, -3);
    const input = await readText(path.join(dir, inName));
    const expected = await readText(path.join(dir, `${name}.out`));
    if (input === null || expected === null) continue;
    tests.push({ name, input, expected, isPublic: name.startsWith("sample") });
  }
  // public samples first, then hidden - matches how students see them
  tests.sort((a, b) => Number(b.isPublic) - Number(a.isPublic) || naturalCompare(a.name, b.name));
  return tests;
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** All problems on disk, drafts included. Instructor use. */
export async function listAllProblems(): Promise<ProblemMeta[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(PROBLEMS_DIR);
  } catch {
    return [];
  }
  const metas: ProblemMeta[] = [];
  for (const slug of entries) {
    if (!SLUG_RE.test(slug)) continue;
    const raw = await readText(path.join(PROBLEMS_DIR, slug, "problem.json"));
    if (raw === null) continue;
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // malformed problem.json - fall back to defaults so the folder still shows up
    }
    metas.push(coerceMeta(slug, parsed));
  }
  metas.sort((a, b) => a.order - b.order || naturalCompare(a.title, b.title));
  return metas;
}

/** Problems students may see right now. */
export async function listProblems(): Promise<ProblemMeta[]> {
  const now = Date.now();
  return (await listAllProblems()).filter((m) => isVisible(m, now));
}

export async function getProblem(slug: string): Promise<Problem | null> {
  if (!SLUG_RE.test(slug)) return null;
  const dir = path.join(PROBLEMS_DIR, slug);
  const raw = await readText(path.join(dir, "problem.json"));
  if (raw === null) return null;
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // see listProblems
  }
  const [description, starter, harness, solution, tests] = await Promise.all([
    readText(path.join(dir, "description.md")),
    readText(path.join(dir, "starter.cpp")),
    readText(path.join(dir, "harness.cpp")),
    readText(path.join(dir, "solution.cpp")),
    readTests(path.join(dir, "tests")),
  ]);
  return {
    ...coerceMeta(slug, parsed),
    description: description ?? "",
    starter: starter ?? "",
    harness,
    solution,
    tests,
  };
}

export function toPublic(p: Problem): PublicProblem {
  const { harness, solution, tests, ...meta } = p;
  return {
    ...meta,
    hasHarness: harness !== null,
    solution: p.solutionPublished ? solution : null,
    publicTests: tests
      .filter((t) => t.isPublic)
      .map(({ name, input, expected }) => ({ name, input, expected })),
    hiddenTestCount: tests.filter((t) => !t.isPublic).length,
  };
}

export type ProblemInput = {
  slug: string;
  meta: Omit<ProblemMeta, "slug">;
  description: string;
  starter: string;
  harness: string | null;
  solution: string | null;
  tests: { name: string; input: string; expected: string }[];
};

/** Writes (or overwrites) a problem folder. Replaces the whole tests/ directory. */
export async function writeProblem(input: ProblemInput): Promise<void> {
  if (!SLUG_RE.test(input.slug)) throw new Error("Invalid slug");
  const dir = path.join(PROBLEMS_DIR, input.slug);
  await fs.mkdir(dir, { recursive: true });

  const { slug: _ignored, ...rest } = { ...input.meta, slug: input.slug };
  void _ignored;
  await fs.writeFile(path.join(dir, "problem.json"), JSON.stringify(rest, null, 2) + "\n");
  await fs.writeFile(path.join(dir, "description.md"), ensureNl(input.description));
  await fs.writeFile(path.join(dir, "starter.cpp"), ensureNl(input.starter));

  await writeOrRemove(path.join(dir, "harness.cpp"), input.harness);
  await writeOrRemove(path.join(dir, "solution.cpp"), input.solution);

  const testsDir = path.join(dir, "tests");
  await fs.rm(testsDir, { recursive: true, force: true });
  await fs.mkdir(testsDir);
  for (const t of input.tests) {
    if (!/^[a-zA-Z0-9_-]+$/.test(t.name)) throw new Error(`Invalid test name: ${t.name}`);
    await fs.writeFile(path.join(testsDir, `${t.name}.in`), ensureNl(t.input));
    await fs.writeFile(path.join(testsDir, `${t.name}.out`), ensureNl(t.expected));
  }
}

/** Patch a few problem.json fields without touching the rest of the folder. */
export async function updateProblemMeta(
  slug: string,
  patch: Partial<Pick<ProblemMeta, "published" | "publishAt" | "solutionPublished">>,
): Promise<void> {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");
  const file = path.join(PROBLEMS_DIR, slug, "problem.json");
  const raw = await readText(file);
  if (raw === null) throw new Error("Problem not found");
  const current = JSON.parse(raw) as Record<string, unknown>;
  await fs.writeFile(file, JSON.stringify({ ...current, ...patch }, null, 2) + "\n");
}

/** Instructor-only reference solutions live in <repo>/solutions/<slug>.cpp (gitignored). */
export async function readReferenceSolution(slug: string): Promise<string | null> {
  if (!SLUG_RE.test(slug)) return null;
  return readText(path.join(process.cwd(), "solutions", `${slug}.cpp`));
}

export async function deleteProblem(slug: string): Promise<void> {
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");
  await fs.rm(path.join(PROBLEMS_DIR, slug), { recursive: true, force: true });
}

async function writeOrRemove(file: string, content: string | null) {
  if (content === null || content.trim() === "") {
    await fs.rm(file, { force: true });
  } else {
    await fs.writeFile(file, ensureNl(content));
  }
}

function ensureNl(s: string) {
  const t = s.replace(/\r\n/g, "\n");
  return t.endsWith("\n") || t === "" ? t : t + "\n";
}
