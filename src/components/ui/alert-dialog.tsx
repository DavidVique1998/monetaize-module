"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Componente AlertDialog con variantes usando Dialog
interface AlertDialogWithVariantProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "success" | "error" | "warning" | "info"
  title: string
  description: string
  actionLabel?: string
  cancelLabel?: string
  onAction?: () => void
  onCancel?: () => void
  showIcon?: boolean
}

export const AlertDialogWithVariant: React.FC<AlertDialogWithVariantProps> = ({
  open,
  onOpenChange,
  variant = "info",
  title,
  description,
  actionLabel = "Aceptar",
  cancelLabel = "Cancelar",
  onAction,
  onCancel,
  showIcon = true,
}) => {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const iconColors = {
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    info: "text-info",
  }

  const Icon = icons[variant] || Info

  const handleAction = () => {
    onAction?.()
    onOpenChange?.(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start space-x-3">
            {showIcon && (
              <Icon className={cn("h-6 w-6 mt-0.5 flex-shrink-0", iconColors[variant])} />
            )}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          {cancelLabel && (
            <Button variant="outline" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={variant === "error" ? "error" : variant === "success" ? "success" : variant === "warning" ? "warning" : "info"}
            onClick={handleAction}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

