import Image from "next/image";
import { auth, authConfigured, signIn, signOut } from "@/auth";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1C3.2 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4.1-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4.1 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

/**
 * Optional Google sign-in. Renders nothing when AUTH_GOOGLE_ID/SECRET are not set,
 * so the site keeps working for students without accounts.
 */
export default async function AuthButton({
  callbackUrl = "/",
  block = false,
}: {
  callbackUrl?: string;
  /** Full-width row style, used inside cards. */
  block?: boolean;
}) {
  const session = authConfigured ? await auth() : null;
  const user = session?.user;

  const btn = `flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-[#0a0a0a]/95 font-medium text-neutral-100 backdrop-blur transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-700 ${
    block ? "w-full px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
  }`;

  if (!user) {
    return (
      <form
        className={block ? "w-full" : undefined}
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <button
          className={btn}
          disabled={!authConfigured}
          title={authConfigured ? undefined : "Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local to enable"}
        >
          <GoogleMark />
          Sign in with Google
        </button>
      </form>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-neutral-800 bg-[#0a0a0a]/95 py-1 pl-1 pr-2 backdrop-blur ${block ? "w-full" : ""}`}
    >
      {user.image ? (
        <Image src={user.image} alt="" width={24} height={24} className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
          {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className={`truncate text-xs text-neutral-200 ${block ? "flex-1" : "max-w-[140px]"}`}>{user.name ?? user.email}</span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: callbackUrl });
        }}
      >
        <button className="text-xs text-neutral-400 transition hover:text-white" title="Sign out">
          Sign out
        </button>
      </form>
    </div>
  );
}
