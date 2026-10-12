"use client";

import { useActionState } from "react";
import { login, type SaveState } from "../actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState<SaveState, FormData>(login, null);
  return (
    <form action={action} className="mx-auto mt-16 max-w-sm rounded-xl border border-neutral-800 bg-[#141414] p-6">
      <h1 className="text-lg font-semibold text-white">Instructor login</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Enter the <code>ADMIN_KEY</code> from <code>.env.local</code>.
      </p>
      <input
        name="key"
        type="password"
        autoFocus
        className="mt-4 w-full rounded-md border border-neutral-800 bg-[#0f0f10] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
      />
      {state?.error && <p className="mt-2 text-sm text-rose-400">{state.error}</p>}
      <button disabled={pending} className="mt-4 w-full rounded-md bg-emerald-500 py-1.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50">
        {pending ? "…" : "Log in"}
      </button>
    </form>
  );
}
