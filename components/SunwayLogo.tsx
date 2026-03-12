export function SunwayLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-8", md: "h-12", lg: "h-16" }[size]
  return (
    <>
      <img src="/logo-dark.png"  alt="Sunway Connect" className={`${h} w-auto object-contain hidden dark:block`} />
      <img src="/logo-light.png" alt="Sunway Connect" className={`${h} w-auto object-contain block dark:hidden`} />
    </>
  )
}
