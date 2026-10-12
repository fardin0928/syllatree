/** The chill335 mark: a small tree drawn in black, lit from behind. Size it with className. */
export default function TreeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true" className={className}>
      <g stroke="black" strokeWidth="7" strokeLinecap="round">
        <line x1="80" y1="22" x2="36" y2="82" />
        <line x1="80" y1="22" x2="124" y2="82" />
        <line x1="36" y1="82" x2="20" y2="122" />
        <line x1="36" y1="82" x2="56" y2="122" />
        <line x1="124" y1="82" x2="140" y2="122" />
      </g>
      <g fill="black">
        <circle cx="80" cy="22" r="17" />
        <circle cx="36" cy="82" r="14" />
        <circle cx="124" cy="82" r="14" />
        <circle cx="20" cy="122" r="11" />
        <circle cx="56" cy="122" r="11" />
        <circle cx="140" cy="122" r="11" />
      </g>
    </svg>
  );
}

/** Glow for the mark at logo size (next to the "chill335" wordmark). */
export const SMALL_GLOW =
  "[filter:drop-shadow(0_0_0.6px_rgba(255,255,255,1))_drop-shadow(0_0_3px_rgba(255,255,255,0.55))]";
