/**
 * The display face has no U+221E, so a literal ∞ falls back to a thin system
 * glyph that sits wrong next to 48 / 100 / 3. Drawing it keeps the weight
 * and the colour under our control.
 */
export default function InfinityMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 56"
      fill="none"
      role="img"
      aria-label="Infinite"
      focusable="false"
    >
      <path
        d="M28 28C28 13.5 43.5 13.5 50 28C56.5 42.5 72 42.5 72 28C72 13.5 56.5 13.5 50 28C43.5 42.5 28 42.5 28 28Z"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}
