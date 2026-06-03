// Airy illustration set — color map (literal hexes, not tokens):
// #283D2E brand-dark (tree canopies) · #4A6741 brand-mid (front hill + bird marks)
// #8A6F3A brand-accent (trunks) · #9DBE83 derived light-green (back hill)
// #3E5C46 derived highlight (canopy highlight). #000 fills are clipPath masks only — never painted.
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
        d="M 734,46 Q 738,41 742,46 Q 746,41 750,46"
        fill="none"
        stroke="#4A6741"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 775.6,40 Q 778.8,36 782,40 Q 785.2,36 788.4,40"
        fill="none"
        stroke="#4A6741"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M0,122 C 300,108 560,112 820,118 C 1080,124 1280,114 1440,118 L1440,200 L0,200 Z"
        fill="#9DBE83"
      />
      <rect x="1084.3" y="96.5" width="3.3" height="26.5" rx="1.7" fill="#8A6F3A" />
      <clipPath id="m1">
        <circle cx="1086" cy="83.1" r="21.6" fill="#000" />
        <circle cx="1075.2" cy="86.6" r="15.1" fill="#000" />
        <circle cx="1096.8" cy="86.6" r="15.1" fill="#000" />
      </clipPath>
      <circle cx="1086" cy="83.1" r="21.6" fill="#283D2E" />
      <circle cx="1075.2" cy="86.6" r="15.1" fill="#283D2E" />
      <circle cx="1096.8" cy="86.6" r="15.1" fill="#283D2E" />
      <g clipPath="url(#m1)">
        <circle cx="1078.7" cy="74.1" r="14.3" fill="#3E5C46" />
      </g>
      <rect x="1182.8" y="106.7" width="2.4" height="16.3" rx="1.2" fill="#8A6F3A" />
      <clipPath id="m2">
        <circle cx="1184" cy="98.9" r="12.6" fill="#000" />
        <circle cx="1177.7" cy="100.9" r="8.8" fill="#000" />
        <circle cx="1190.3" cy="100.9" r="8.8" fill="#000" />
      </clipPath>
      <circle cx="1184" cy="98.9" r="12.6" fill="#283D2E" />
      <circle cx="1177.7" cy="100.9" r="8.8" fill="#283D2E" />
      <circle cx="1190.3" cy="100.9" r="8.8" fill="#283D2E" />
      <g clipPath="url(#m2)">
        <circle cx="1179.7" cy="93.6" r="8.3" fill="#3E5C46" />
      </g>
      <path
        d="M0,156 C 320,146 620,160 900,152 C 1140,145 1320,158 1440,152 L1440,200 L0,200 Z"
        fill="#4A6741"
      />
      <rect x="327.7" y="120" width="4.6" height="36" rx="2.3" fill="#8A6F3A" />
      <clipPath id="m3">
        <circle cx="330" cy="101.4" r="30" fill="#000" />
        <circle cx="315" cy="106.2" r="21" fill="#000" />
        <circle cx="345" cy="106.2" r="21" fill="#000" />
      </clipPath>
      <circle cx="330" cy="101.4" r="30" fill="#283D2E" />
      <circle cx="315" cy="106.2" r="21" fill="#283D2E" />
      <circle cx="345" cy="106.2" r="21" fill="#283D2E" />
      <g clipPath="url(#m3)">
        <circle cx="319.8" cy="88.8" r="19.8" fill="#3E5C46" />
      </g>
      <rect x="470.7" y="135" width="2.6" height="21" rx="1.3" fill="#8A6F3A" />
      <clipPath id="m4">
        <circle cx="472" cy="124.5" r="16.8" fill="#000" />
        <circle cx="463.6" cy="127.2" r="11.8" fill="#000" />
        <circle cx="480.4" cy="127.2" r="11.8" fill="#000" />
      </clipPath>
      <circle cx="472" cy="124.5" r="16.8" fill="#283D2E" />
      <circle cx="463.6" cy="127.2" r="11.8" fill="#283D2E" />
      <circle cx="480.4" cy="127.2" r="11.8" fill="#283D2E" />
      <g clipPath="url(#m4)">
        <circle cx="466.3" cy="117.5" r="11.1" fill="#3E5C46" />
      </g>
    </svg>
  );
}
