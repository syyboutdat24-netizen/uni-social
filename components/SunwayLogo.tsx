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

  const h = { sm: "h-16 md:h-16", md: "h-20 md:h-20", lg: "h-24 md:h-24" }[size]

  return (
    <img
      src={isDark ? "/logo-dark.png" : "/logo-light.png"}
      alt="Sunway Connect"
      className={`${h} w-auto object-contain`}
    />
  )
}
