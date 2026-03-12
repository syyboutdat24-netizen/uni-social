export function SunwayLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-12", md: "h-16", lg: "h-24" }[size]
  return (
    <>
      <img src="/logo-dark.png"  alt="Sunway Connect" className={`${h} w-auto object-contain hidden dark:block`} />
      <img src="/logo-light.png" alt="Sunway Connect" className={`${h} w-auto object-contain block dark:hidden`} />
    </>
  )
}
