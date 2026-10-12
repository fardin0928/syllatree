import Link from "next/link";
import AuthButton from "./AuthButton";
import TreeMark, { SMALL_GLOW } from "./TreeMark";

export default function SiteNav({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#141414] px-4">
      <div className="flex items-center gap-5 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <TreeMark className={`h-4 w-auto ${SMALL_GLOW}`} />
          chill335
        </Link>
        <Link href="/roadmap" className="text-neutral-400 transition hover:text-white">
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
