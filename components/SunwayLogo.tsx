export function SunwayLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-48", md: "h-64", lg: "h-80" }[size]
  return (
    <>
      <img src="/logo-dark.png"  alt="Sunway Connect" className={`${h} w-auto object-contain hidden dark:block`} />
      <img src="/logo-light.png" alt="Sunway Connect" className={`${h} w-auto object-contain block dark:hidden`} />
    </>
  )
}
