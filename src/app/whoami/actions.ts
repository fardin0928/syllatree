"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminKeyMatches, isAdmin } from "@/lib/admin";
import {
  DIFFICULTIES,
  FLAG_RE,
  SLUG_RE,
  deleteProblem,
  getProblem,
  readReferenceSolution,
  updateProblemMeta,
  writeProblem,
  type Difficulty,
  type ProblemInput,
} from "@/lib/problems";

export type SaveState = { error?: string } | null;

export async function login(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const key = String(formData.get("key") ?? "");
  if (!adminKeyMatches(key)) return { error: "Wrong key." };
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/whoami");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/whoami/login");
}

type TestRow = { name: string; input: string; expected: string };

export async function saveProblem(_prev: SaveState, formData: FormData): Promise<SaveState> {
  if (!(await isAdmin())) return { error: "Unauthorized." };

  const originalSlug = String(formData.get("originalSlug") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  if (!SLUG_RE.test(slug)) return { error: "Slug must be lowercase letters, digits and dashes (e.g. two-sum)." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const difficulty = String(formData.get("difficulty") ?? "Easy") as Difficulty;
  if (!DIFFICULTIES.includes(difficulty)) return { error: "Bad difficulty." };

  const timeLimitMs = Number(formData.get("timeLimitMs") ?? 2000);
  if (!Number.isFinite(timeLimitMs) || timeLimitMs < 100 || timeLimitMs > 30_000) {
    return { error: "Time limit must be between 100 and 30000 ms." };
  }

  let tests: TestRow[];
  try {
    tests = JSON.parse(String(formData.get("tests") ?? "[]")) as TestRow[];
    if (!Array.isArray(tests)) throw new Error();
  } catch {
    return { error: "Tests payload malformed." };
  }
  const seen = new Set<string>();
  for (const t of tests) {
    if (!/^[a-zA-Z0-9_-]+$/.test(t.name)) return { error: `Bad test name "${t.name}".` };
    if (seen.has(t.name)) return { error: `Duplicate test name "${t.name}".` };
    seen.add(t.name);
  }

  const extraFlags = String(formData.get("extraFlags") ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const badFlag = extraFlags.find((f) => !FLAG_RE.test(f));
  if (badFlag) return { error: `Bad compiler flag "${badFlag}". Flags must look like -fsanitize=address.` };

  // Creating a new problem must not silently overwrite an existing folder.
  if (originalSlug !== slug && (await getProblem(slug))) {
    return { error: `A problem with slug "${slug}" already exists.` };
  }

  const input: ProblemInput = {
    slug,
    meta: {
      title,
      difficulty,
      topic: String(formData.get("topic") ?? "").trim(),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      timeLimitMs,
      inputFormat: String(formData.get("inputFormat") ?? ""),
      extraFlags,
      order: Number(formData.get("order") ?? 1000) || 1000,
      published: formData.get("published") === "on",
      publishAt: String(formData.get("publishAt") ?? "").trim() || null,
      solutionPublished: formData.get("solutionPublished") === "on",
    },
    description: String(formData.get("description") ?? ""),
    starter: String(formData.get("starter") ?? ""),
    harness: String(formData.get("harness") ?? "") || null,
    solution: String(formData.get("solution") ?? "") || null,
    tests,
  };

  try {
    await writeProblem(input);
    if (originalSlug && originalSlug !== slug) await deleteProblem(originalSlug);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to write problem." };
  }

  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/whoami");
  redirect(`/whoami/edit/${slug}?saved=1`);
}

/** One-click switches on the /whoami list. */
export async function setPublished(formData: FormData) {
  if (!(await isAdmin())) return;
  const slug = String(formData.get("slug") ?? "");
  const published = formData.get("published") === "true";
  await updateProblemMeta(slug, { published });
  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/whoami");
}

export async function setSolutionPublished(formData: FormData) {
  if (!(await isAdmin())) return;
  const slug = String(formData.get("slug") ?? "");
  const solutionPublished = formData.get("solutionPublished") === "true";
  await updateProblemMeta(slug, { solutionPublished });
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/whoami");
}

/** Copy solutions/<slug>.cpp (instructor-only folder) into the problem as solution.cpp. */
export async function importReferenceSolution(formData: FormData) {
  if (!(await isAdmin())) return;
  const slug = String(formData.get("slug") ?? "");
  const [p, ref] = await Promise.all([getProblem(slug), readReferenceSolution(slug)]);
  if (!p || ref === null) return;
  await writeProblem({
    slug,
    meta: {
      title: p.title, difficulty: p.difficulty, topic: p.topic, tags: p.tags, timeLimitMs: p.timeLimitMs,
      inputFormat: p.inputFormat, extraFlags: p.extraFlags, order: p.order,
      published: p.published, publishAt: p.publishAt, solutionPublished: p.solutionPublished,
    },
    description: p.description,
    starter: p.starter,
    harness: p.harness,
    solution: ref,
    tests: p.tests.map(({ name, input, expected }) => ({ name, input, expected })),
  });
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/whoami");
  redirect(`/whoami/edit/${slug}?saved=1`);
}

export async function removeProblem(formData: FormData) {
  if (!(await isAdmin())) return;
  const slug = String(formData.get("slug") ?? "");
  await deleteProblem(slug);
  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath("/whoami");
  redirect("/whoami");
}
