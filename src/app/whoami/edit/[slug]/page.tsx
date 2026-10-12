import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProblemForm, { type FormInitial } from "@/components/admin/ProblemForm";
import { isAdmin } from "@/lib/admin";
import { getProblem } from "@/lib/problems";
import { TOPICS } from "@/data/roadmap";

export default async function EditProblem(props: PageProps<"/whoami/edit/[slug]">) {
  if (!(await isAdmin())) redirect("/whoami/login");
  const { slug } = await props.params;
  const { saved } = await props.searchParams;
  const p = await getProblem(slug);
  if (!p) notFound();

  const initial: FormInitial = {
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topic: p.topic,
    tags: p.tags.join(", "),
    timeLimitMs: p.timeLimitMs,
    inputFormat: p.inputFormat,
    extraFlags: p.extraFlags.join(" "),
    published: p.published,
    publishAt: p.publishAt ?? "",
    solutionPublished: p.solutionPublished,
    order: p.order,
    description: p.description,
    starter: p.starter,
    harness: p.harness ?? "",
    solution: p.solution ?? "",
    tests: p.tests.map(({ name, input, expected }) => ({ name, input, expected })),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold text-white">Edit: {p.title}</h1>
        <Link href={`/problems/${p.slug}`} className="text-sm text-indigo-300 hover:text-indigo-200">
          open student view →
        </Link>
        {saved && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">Saved</span>}
      </div>
      <div className="mt-6">
        <ProblemForm key={p.slug} initial={initial} topics={TOPICS.map((t) => ({ id: t.id, title: t.title }))} isNew={false} />
      </div>
    </div>
  );
}
