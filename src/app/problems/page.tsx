import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import ProblemsTable from "@/components/ProblemsTable";
import { listProblems } from "@/lib/problems";
import { TOPICS } from "@/data/roadmap";

export const metadata: Metadata = { title: "Problems — chill335" };
export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const problems = await listProblems();
  const topicTitles = Object.fromEntries(TOPICS.map((t) => [t.id, t.title]));
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Problems</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Write C++ in the browser, run it against test cases, submit for hidden tests. Progress is saved in this browser.
        </p>
        <div className="mt-6">
          <ProblemsTable problems={problems} topicTitles={topicTitles} />
        </div>
      </main>
    </div>
  );
}
