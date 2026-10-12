import Link from "next/link";
import AuthButton from "./AuthButton";

export default function SiteNav({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#141414] px-4">
      <div className="flex items-center gap-5 text-sm">
        <Link href="/" className="font-semibold tracking-tight text-white">
          chill335
        </Link>
        <Link href="/" className="text-neutral-400 transition hover:text-white">
          Roadmap
        </Link>
        <Link href="/problems" className="text-neutral-400 transition hover:text-white">
          Problems
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {right}
        <AuthButton />
      </div>
    </nav>
  );
}
