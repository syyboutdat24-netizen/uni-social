// components/SunwayLogo.tsx

interface SunwayLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
}

export function SunwayLogo({ size = "md" }: SunwayLogoProps) {
  const fontSize = { sm: "15px", md: "20px", lg: "28px", xl: "40px" }[size]

  return (
    <span
      className="inline-flex items-center gap-1.5 leading-none select-none font-black"
      style={{ fontSize, fontFamily: "'Arial Black', Impact, sans-serif" }}
    >
      {/* Stacked Sunway / Connect */}
      <span className="flex flex-col" style={{ lineHeight: 1.1 }}>
        <span style={{ color: "#5B4EE8" }}>Sunway</span>
        <span className="text-zinc-900 dark:text-white">Connect</span>
      </span>

      {/* WiFi + person icon — dark in light mode, white in dark mode */}
      <svg
        viewBox="0 0 36 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: "1.6em", width: "auto", flexShrink: 0 }}
      >
        <path d="M3 22 Q18 4 33 22"   stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M8 26 Q18 12 28 26"  stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M13 30 Q18 22 23 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="18" cy="37" r="4" fill="currentColor"/>
      </svg>
    </span>
  )
}
