// Hero landscape band — clean two-tone rolling hills (Airy set, simplified: no trees/birds).
// #9DBE83 derived light-green (back hill) · #4A6741 brand-mid (front hill).
export function LandscapeDivider({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 200"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0,122 C 300,108 560,112 820,118 C 1080,124 1280,114 1440,118 L1440,200 L0,200 Z"
        fill="#9DBE83"
      />
      <path
        d="M0,156 C 320,146 620,160 900,152 C 1140,145 1320,158 1440,152 L1440,200 L0,200 Z"
        fill="#4A6741"
      />
    </svg>
  );
}
