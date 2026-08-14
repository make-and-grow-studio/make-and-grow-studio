/**
 * Fixed SVG noise at ~4%, overlay blend. Pure CSS/SVG — no canvas loop,
 * so it costs nothing on a phone.
 */
export default function Grain() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-grain)' as unknown as number,
        pointerEvents: 'none',
        // On a light canvas, overlay grain at any real strength just reads
        // as dirt. Barely there is the whole brief.
        mixBlendMode: 'multiply',
        opacity: 0.06,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")",
        backgroundSize: '220px 220px',
      }}
    />
  );
}
