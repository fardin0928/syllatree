"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const KEY = "roadmap-progress-v1";

type State = {
  solved: Set<string>;
  starred: Set<string>;
  prereqs: Set<string>;
};

const EMPTY: State = { solved: new Set(), starred: new Set(), prereqs: new Set() };

let state: State = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function hydrate() {
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Record<keyof State, string[]>>;
    state = {
      solved: new Set(parsed.solved ?? []),
      starred: new Set(parsed.starred ?? []),
      prereqs: new Set(parsed.prereqs ?? []),
    };
  } catch {
    // corrupt or blocked storage - start from an empty board
  }
}

function persist() {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        solved: [...state.solved],
        starred: [...state.starred],
        prereqs: [...state.prereqs],
      }),
    );
  } catch {
    // storage full or blocked - progress stays in memory for this session
  }
}

function subscribe(listener: () => void) {
  // First subscribe happens after mount, so reading storage here keeps SSR
  // markup and the first client render identical.
  if (!hydrated) {
    hydrate();
    queueMicrotask(emit);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY;

function toggle(key: keyof State, id: string) {
  const next = new Set(state[key]);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  state = { ...state, [key]: next };
  persist();
  emit();
}

function addSolved(ids: string[]) {
  const next = new Set(state.solved);
  for (const id of ids) next.add(id);
  if (next.size === state.solved.size) return;
  state = { ...state, solved: next };
  persist();
  emit();
}

export function useProgress() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleSolved = useCallback((id: string) => toggle("solved", id), []);
  const toggleStarred = useCallback((id: string) => toggle("starred", id), []);
  const togglePrereq = useCallback((id: string) => toggle("prereqs", id), []);
  const markSolved = useCallback((ids: string[]) => addSolved(ids), []);
  const reset = useCallback(() => {
    state = { solved: new Set(), starred: new Set(), prereqs: new Set() };
    persist();
    emit();
  }, []);

  return useMemo(
    () => ({
      solved: snap.solved,
      starred: snap.starred,
      prereqs: snap.prereqs,
      toggleSolved,
      toggleStarred,
      togglePrereq,
      markSolved,
      reset,
    }),
    [snap, toggleSolved, toggleStarred, togglePrereq, markSolved, reset],
  );
}
