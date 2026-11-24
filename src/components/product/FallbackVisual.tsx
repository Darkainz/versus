import {
  fallbackAccent,
  fallbackVisuals,
  productArtworkPalettes,
  type Brand,
  type DeviceKind,
} from "@/lib/brand-themes";

function paletteFor(code: string) {
  let hash = 0;
  for (const character of code) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return productArtworkPalettes[hash % productArtworkPalettes.length]!;
}

/** Illustration vectorielle originale, colorée de façon déterministe selon le code produit. */
export function FallbackVisual({
  kind,
  brand,
  code,
  label,
}: {
  kind: DeviceKind;
  brand: Brand;
  code: string;
  /** Nom accessible ; chaîne vide pour un visuel décoratif. */
  label: string;
}) {
  const palette = paletteFor(code);
  const accent = palette.accent;
  const brandAccent = fallbackAccent[brand];
  const { sheenLight, shadow } = fallbackVisuals;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" {...a11y}>
      {kind === "phone" ? (
        <>
          <ellipse cx="102" cy="223" rx="77" ry="8" fill={shadow} opacity=".12" />
          <rect x="18" y="47" width="78" height="166" rx="20" fill={palette.body} />
          <rect x="24" y="54" width="39" height="47" rx="13" fill={accent} />
          <circle cx="36" cy="68" r="7" fill={palette.screen} />
          <circle cx="52" cy="68" r="7" fill={palette.screen} />
          <circle cx="36" cy="86" r="7" fill={palette.screen} />
          <circle cx="52" cy="86" r="4" fill={brandAccent} />
          <rect x="103" y="17" width="80" height="205" rx="24" fill={palette.body} />
          <rect x="109" y="23" width="68" height="193" rx="19" fill={palette.screen} />
          <path d="M109 145c18-23 42-31 68-23v94h-68z" fill={accent} opacity=".9" />
          <circle cx="165" cy="56" r="29" fill={palette.glow} opacity=".7" />
          <path d="M109 161c24-22 44-13 68 0v55h-68z" fill={palette.glow} opacity=".42" />
          <rect x="134" y="29" width="18" height="3" rx="2" fill={palette.screen} />
        </>
      ) : kind === "buds" ? (
        <>
          <ellipse cx="101" cy="209" rx="67" ry="8" fill={shadow} opacity=".12" />
          <path d="M45 95V77c0-25 21-43 55-43s55 18 55 43v18z" fill={palette.body} />
          <rect x="38" y="91" width="124" height="91" rx="29" fill={palette.body} />
          <path d="M45 111h110" stroke={accent} strokeWidth="3" opacity=".75" />
          <rect x="94" y="153" width="12" height="4" rx="2" fill={brandAccent} />
          <path
            d="M63 28c-11 0-19 9-19 20v16c0 11 8 19 19 19h8V47c0-11-8-19-19-19z"
            fill={sheenLight}
            stroke={accent}
            strokeWidth="4"
          />
          <rect
            x="60"
            y="53"
            width="10"
            height="35"
            rx="5"
            fill={sheenLight}
            stroke={accent}
            strokeWidth="3"
          />
          <path
            d="M137 28c11 0 19 9 19 20v16c0 11-8 19-19 19h-8V47c0-11 8-19 19-19z"
            fill={sheenLight}
            stroke={accent}
            strokeWidth="4"
          />
          <rect
            x="130"
            y="53"
            width="10"
            height="35"
            rx="5"
            fill={sheenLight}
            stroke={accent}
            strokeWidth="3"
          />
        </>
      ) : kind === "band" ? (
        <>
          <ellipse cx="101" cy="225" rx="39" ry="7" fill={shadow} opacity=".12" />
          <path d="M77 12h46l-8 76H85zM85 155h30l8 73H77z" fill={palette.strap} />
          <rect x="58" y="71" width="84" height="101" rx="26" fill={palette.body} />
          <rect x="65" y="78" width="70" height="87" rx="21" fill={palette.screen} />
          <circle cx="100" cy="121" r="24" fill="none" stroke={palette.glow} strokeWidth="5" />
          <path
            d="M100 101v20l13 8"
            fill="none"
            stroke={palette.glow}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="121" r="3" fill={sheenLight} />
          <circle cx="100" cy="184" r="3" fill={brandAccent} />
        </>
      ) : (
        <>
          <ellipse cx="100" cy="226" rx="45" ry="7" fill={shadow} opacity=".12" />
          <path d="M75 10h50l-9 68H84zM84 160h32l9 68H75z" fill={palette.strap} />
          <path
            d="M88 25h24l-3 39H91zM91 177h18l3 38H88z"
            fill="none"
            stroke={sheenLight}
            strokeWidth="3"
            opacity=".65"
          />
          <circle cx="157" cy="108" r="5" fill={brandAccent} />
          {kind === "round" ? (
            <>
              <circle
                cx="100"
                cy="120"
                r="57"
                fill={palette.body}
                stroke={accent}
                strokeWidth="5"
              />
              <circle cx="100" cy="120" r="47" fill={palette.screen} />
              <circle cx="100" cy="120" r="32" fill="none" stroke={palette.glow} strokeWidth="4" />
              <path
                d="M100 93v28l21 11"
                fill="none"
                stroke={sheenLight}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="100" cy="120" r="4" fill={palette.glow} />
            </>
          ) : (
            <>
              <rect
                x="46"
                y="64"
                width="108"
                height="112"
                rx="30"
                fill={palette.body}
                stroke={accent}
                strokeWidth="5"
              />
              <rect x="55" y="73" width="90" height="94" rx="23" fill={palette.screen} />
              <circle cx="100" cy="119" r="26" fill="none" stroke={palette.glow} strokeWidth="4" />
              <path
                d="M100 98v22l15 9"
                fill="none"
                stroke={sheenLight}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="100" cy="120" r="4" fill={palette.glow} />
            </>
          )}
        </>
      )}
    </svg>
  );
}
