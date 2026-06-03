// Airy illustration set — color map (literal hexes, not tokens):
// #283D2E brand-dark (tree canopy) · #8A6F3A brand-accent (trunk)
// #3E5C46 derived highlight (canopy highlight). #000 fills are clipPath masks only — never painted.
export function CornerTree({
  corner,
  className,
}: {
  corner: "tl" | "br";
  className?: string;
}) {
  const clipId = `airyTree${corner}`;
  const art = (
    <>
      <path
        d="M 18,12 L 184,239"
        stroke="#8A6F3A"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <clipPath id={clipId}>
        <circle cx="190" cy="180" r="118" fill="#000" />
        <circle cx="131" cy="198.9" r="82.6" fill="#000" />
        <circle cx="249" cy="198.9" r="82.6" fill="#000" />
      </clipPath>
      <circle cx="190" cy="180" r="118" fill="#283D2E" />
      <circle cx="131" cy="198.9" r="82.6" fill="#283D2E" />
      <circle cx="249" cy="198.9" r="82.6" fill="#283D2E" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx="149.9" cy="130.4" r="77.9" fill="#3E5C46" />
      </g>
    </>
  );

  return (
    <svg viewBox="0 0 360 360" fill="none" aria-hidden="true" className={className}>
      {corner === "br" ? <g transform="rotate(180 180 180)">{art}</g> : art}
    </svg>
  );
}
