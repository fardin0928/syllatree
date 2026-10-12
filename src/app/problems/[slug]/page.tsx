import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import ProblemWorkspace, { BackLink } from "@/components/problem/ProblemWorkspace";
import { getProblem, isVisible, toPublic, visibilityState } from "@/lib/problems";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProblem(slug);
  return { title: p ? `${p.title} — chill335` : "Problem not found" };
}

export default async function ProblemPage(props: PageProps<"/problems/[slug]">) {
  const { slug } = await props.params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const visible = isVisible(problem);
  if (!visible && !(await isAdmin())) notFound();
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SiteNav
        right={
          <>
            {!visible && (
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                {visibilityState(problem) === "scheduled" ? "Scheduled · instructor preview" : "Draft · instructor preview"}
              </span>
            )}
            <BackLink />
          </>
        }
      />
      <ProblemWorkspace problem={toPublic(problem)} />
    </div>
  );
}
