import type * as React from "react"
import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive"

export type AppToast = {
  title: string
  description?: React.ReactNode
  variant?: ToastVariant
}

function toast({ title, description, variant = "default" }: AppToast) {
  if (variant === "destructive") {
    return sonnerToast.error(title, { description })
  }

  return sonnerToast(title, { description })
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  }
}

export { useToast, toast }
