"use client"

import { useEffect, useState } from "react"

export function SunwayLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // sm = navbar (small), md = medium, lg = login/verify pages
  const h = { sm: "h-8 md:h-9", md: "h-10 md:h-12", lg: "h-14 md:h-16" }[size]

  return (
    <img
      src={isDark ? "/logo-dark.png" : "/logo-light.png"}
      alt="Sunway Connect"
      className={`${h} w-auto object-contain`}
    />
  )
}
