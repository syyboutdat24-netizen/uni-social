// components/SunwayLogo.tsx
// Usage: <SunwayLogo className="h-8" />
// Dark mode: shows white logo. Light mode: shows dark logo.

interface SunwayLogoProps {
  className?: string
}

export function SunwayLogo({ className = "h-8" }: SunwayLogoProps) {
  return (
    <>
      {/* Shown in dark mode */}
      <img
        src="/logo-dark.png"
        alt="Sunway Connect"
        className={`${className} w-auto object-contain hidden dark:block`}
      />
      {/* Shown in light mode */}
      <img
        src="/logo-light.png"
        alt="Sunway Connect"
        className={`${className} w-auto object-contain block dark:hidden`}
      />
    </>
  )
}
