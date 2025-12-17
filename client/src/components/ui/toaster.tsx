"use client"

import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    if (typeof document === "undefined") return "dark"
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
  })

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const getTheme = () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light"

    setTheme(getTheme())

    const observer = new MutationObserver(() => {
      setTheme(getTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster
      theme={theme}
      richColors
      closeButton
      containerAriaLabel="Notifications (F8)"
      toastOptions={{
        duration: 8000,
        style: {
          // Sonner expects these CSS variables for the base theme.
          // We map them to our shadcn CSS variables.
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties,
      }}
    />
  )
}
