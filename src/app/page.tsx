import AuthButton from "@/components/AuthButton";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import { listProblems } from "@/lib/problems";

export const dynamic = "force-dynamic";

export default async function Home() {
  const problems = await listProblems();
  return <RoadmapCanvas problems={problems} authSlot={<AuthButton callbackUrl="/" block />} />;
}
