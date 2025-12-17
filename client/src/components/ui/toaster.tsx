"use client"

import type * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
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
