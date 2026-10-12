import { redirect } from "next/navigation";
import ProblemForm, { EMPTY_INITIAL } from "@/components/admin/ProblemForm";
import { isAdmin } from "@/lib/admin";
import { TOPICS } from "@/data/roadmap";

export default async function NewProblem() {
  if (!(await isAdmin())) redirect("/whoami/login");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">New problem</h1>
      <div className="mt-6">
        <ProblemForm initial={EMPTY_INITIAL} topics={TOPICS.map((t) => ({ id: t.id, title: t.title }))} isNew />
      </div>
    </div>
  );
}
