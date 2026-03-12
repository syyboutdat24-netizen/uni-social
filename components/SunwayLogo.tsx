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

  // Dark logo has lots of padding so needs to be bigger to appear same visual size
  const h = isDark
    ? { sm: "h-24 md:h-16", md: "h-28 md:h-20", lg: "h-32 md:h-24" }[size]
    : { sm: "h-16 md:h-10", md: "h-20 md:h-14", lg: "h-24 md:h-18" }[size]

  return (
    <img
      src={isDark ? "/logo-dark.png" : "/logo-light.png"}
      alt="Sunway Connect"
      className={`${h} w-auto object-contain`}
    />
  )
}
