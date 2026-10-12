import type { Metadata } from "next";
import AuthButton from "@/components/AuthButton";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import { listProblems } from "@/lib/problems";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Roadmap — chill335" };

export default async function RoadmapPage() {
  const problems = await listProblems();
  return <RoadmapCanvas problems={problems} authSlot={<AuthButton callbackUrl="/roadmap" block />} />;
}
