import SiteNav from "@/components/SiteNav";
import { isAdmin } from "@/lib/admin";
import { logout } from "./actions";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
// Keep instructor pages out of search engines. They are also not linked from any student page.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/whoami">) {
  const admin = await isAdmin();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav
        right={
          admin ? (
            <form action={logout}>
              <button className="text-xs text-neutral-400 hover:text-white">Log out</button>
            </form>
          ) : null
        }
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
