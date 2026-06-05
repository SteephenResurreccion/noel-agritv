// Corner-rooted illustration set — color map (literal hexes, not tokens):
// canopy #283D2E rim / #4A6741 body / #6E9054 highlight · trunk #8A6F3A (+ #6B5429 @0.45 shadow) · mound #6E9A4E body / #86B062 sunlit top
type CornerArt = "topleft-1" | "topleft-2" | "bottomright-tree" | "bottomright-mound";

export function CornerTree({
  art,
  className,
}: {
  art: CornerArt;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 360 360" fill="none" aria-hidden="true" className={className}>
      {art === "topleft-1" && (
        <>
          <path d="M -34,232 C 26,236 72,228 112,200 C 142,178 160,156 172,136 C 164,160 150,188 124,216 C 90,250 32,268 -34,268 Z" fill="#8A6F3A" />
          <path d="M -34,268 C 32,268 90,250 124,216 C 138,200 150,176 160,154 C 150,184 140,214 116,238 C 84,266 28,282 -34,288 Z" fill="#6B5429" opacity="0.45" />
          <path d="M 96,212 C 122,194 152,176 180,158 C 158,182 132,206 108,226 Z" fill="#8A6F3A" />
          <circle cx="148" cy="98" r="86" fill="#283D2E" />
          <circle cx="66" cy="82" r="58" fill="#283D2E" />
          <circle cx="224" cy="112" r="62" fill="#283D2E" />
          <circle cx="124" cy="38" r="58" fill="#283D2E" />
          <circle cx="204" cy="54" r="48" fill="#283D2E" />
          <circle cx="44" cy="42" r="44" fill="#283D2E" />
          <circle cx="276" cy="134" r="44" fill="#283D2E" />
          <circle cx="180" cy="150" r="50" fill="#283D2E" />
          <circle cx="96" cy="142" r="48" fill="#283D2E" />
          <circle cx="256" cy="82" r="36" fill="#283D2E" />
          <circle cx="306" cy="120" r="30" fill="#283D2E" />
          <circle cx="16" cy="96" r="42" fill="#283D2E" />
          <circle cx="148" cy="84" r="86" fill="#4A6741" />
          <circle cx="66" cy="68" r="58" fill="#4A6741" />
          <circle cx="224" cy="98" r="62" fill="#4A6741" />
          <circle cx="124" cy="24" r="58" fill="#4A6741" />
          <circle cx="204" cy="40" r="48" fill="#4A6741" />
          <circle cx="44" cy="28" r="44" fill="#4A6741" />
          <circle cx="276" cy="120" r="44" fill="#4A6741" />
          <circle cx="180" cy="136" r="50" fill="#4A6741" />
          <circle cx="96" cy="128" r="48" fill="#4A6741" />
          <circle cx="256" cy="68" r="36" fill="#4A6741" />
          <circle cx="306" cy="106" r="30" fill="#4A6741" />
          <circle cx="16" cy="82" r="42" fill="#4A6741" />
          <circle cx="104" cy="68" r="30" fill="#6E9054" />
          <circle cx="150" cy="56" r="24" fill="#6E9054" />
          <circle cx="72" cy="96" r="22" fill="#6E9054" />
        </>
      )}

      {art === "topleft-2" && (
        <>
          <path d="M -34,256 C 30,262 84,252 130,222 C 158,204 176,180 190,160 C 180,186 166,214 138,242 C 96,278 32,294 -34,292 Z" fill="#8A6F3A" />
          <path d="M -34,292 C 32,294 96,278 138,242 C 154,228 168,204 178,182 C 168,212 156,242 130,266 C 96,292 36,306 -34,310 Z" fill="#6B5429" opacity="0.45" />
          <path d="M 112,224 C 140,204 172,184 202,166 C 178,192 150,216 124,238 Z" fill="#8A6F3A" />
          <circle cx="160" cy="100" r="82" fill="#283D2E" />
          <circle cx="80" cy="86" r="56" fill="#283D2E" />
          <circle cx="236" cy="116" r="60" fill="#283D2E" />
          <circle cx="134" cy="42" r="54" fill="#283D2E" />
          <circle cx="216" cy="58" r="46" fill="#283D2E" />
          <circle cx="52" cy="46" r="42" fill="#283D2E" />
          <circle cx="290" cy="140" r="46" fill="#283D2E" />
          <circle cx="196" cy="150" r="50" fill="#283D2E" />
          <circle cx="104" cy="146" r="46" fill="#283D2E" />
          <circle cx="266" cy="86" r="36" fill="#283D2E" />
          <circle cx="320" cy="122" r="30" fill="#283D2E" />
          <circle cx="24" cy="98" r="40" fill="#283D2E" />
          <circle cx="160" cy="86" r="82" fill="#4A6741" />
          <circle cx="80" cy="72" r="56" fill="#4A6741" />
          <circle cx="236" cy="102" r="60" fill="#4A6741" />
          <circle cx="134" cy="28" r="54" fill="#4A6741" />
          <circle cx="216" cy="44" r="46" fill="#4A6741" />
          <circle cx="52" cy="32" r="42" fill="#4A6741" />
          <circle cx="290" cy="126" r="46" fill="#4A6741" />
          <circle cx="196" cy="136" r="50" fill="#4A6741" />
          <circle cx="104" cy="132" r="46" fill="#4A6741" />
          <circle cx="266" cy="72" r="36" fill="#4A6741" />
          <circle cx="320" cy="108" r="30" fill="#4A6741" />
          <circle cx="24" cy="84" r="40" fill="#4A6741" />
          <circle cx="114" cy="70" r="28" fill="#6E9054" />
          <circle cx="160" cy="58" r="22" fill="#6E9054" />
          <circle cx="84" cy="98" r="20" fill="#6E9054" />
        </>
      )}

      {art === "bottomright-tree" && (
        <>
          <path d="M 176,198 C 220,212 266,248 302,290 C 330,324 350,346 376,358 L 372,392 C 338,366 308,336 282,304 C 248,262 208,232 168,222 Z" fill="#8A6F3A" />
          <path d="M 376,358 C 350,346 330,324 302,290 C 286,270 268,250 250,234 C 276,256 300,282 320,308 C 344,338 360,356 388,368 Z" fill="#6B5429" opacity="0.45" />
          <path d="M 226,232 C 258,210 292,192 326,178 C 300,200 270,222 244,244 Z" fill="#8A6F3A" />
          <circle cx="150" cy="140" r="84" fill="#283D2E" />
          <circle cx="78" cy="120" r="56" fill="#283D2E" />
          <circle cx="220" cy="150" r="58" fill="#283D2E" />
          <circle cx="130" cy="72" r="54" fill="#283D2E" />
          <circle cx="208" cy="90" r="46" fill="#283D2E" />
          <circle cx="60" cy="70" r="44" fill="#283D2E" />
          <circle cx="236" cy="196" r="46" fill="#283D2E" />
          <circle cx="96" cy="186" r="48" fill="#283D2E" />
          <circle cx="170" cy="198" r="50" fill="#283D2E" />
          <circle cx="28" cy="118" r="40" fill="#283D2E" />
          <circle cx="190" cy="58" r="34" fill="#283D2E" />
          <circle cx="150" cy="126" r="84" fill="#4A6741" />
          <circle cx="78" cy="106" r="56" fill="#4A6741" />
          <circle cx="220" cy="136" r="58" fill="#4A6741" />
          <circle cx="130" cy="58" r="54" fill="#4A6741" />
          <circle cx="208" cy="76" r="46" fill="#4A6741" />
          <circle cx="60" cy="56" r="44" fill="#4A6741" />
          <circle cx="236" cy="182" r="46" fill="#4A6741" />
          <circle cx="96" cy="172" r="48" fill="#4A6741" />
          <circle cx="170" cy="184" r="50" fill="#4A6741" />
          <circle cx="28" cy="104" r="40" fill="#4A6741" />
          <circle cx="190" cy="44" r="34" fill="#4A6741" />
          <circle cx="112" cy="108" r="30" fill="#6E9054" />
          <circle cx="158" cy="92" r="24" fill="#6E9054" />
          <circle cx="82" cy="128" r="22" fill="#6E9054" />
        </>
      )}

      {art === "bottomright-mound" && (
        <>
          <path d="M -30,360 C -30,322 50,302 130,290 C 196,280 222,154 292,156 C 330,157 348,196 360,206 L 360,360 Z" fill="#6E9A4E" />
          <path d="M 130,290 C 196,280 222,154 292,156 C 330,157 348,196 360,206 C 350,214 330,184 296,184 C 236,184 214,300 146,305 Z" fill="#86B062" />
        </>
      )}
    </svg>
  );
}
