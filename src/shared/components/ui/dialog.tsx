"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-slate-950/35 backdrop-blur-[6px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          /* Base layout: Frosted luxury glass style aligned with design.md */
          "fixed z-50 flex flex-col w-full max-h-[min(92vh,780px)]",
          "bg-white/95 backdrop-blur-2xl text-foreground outline-none duration-200",
          "border border-white/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22),0_0_0_1px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]",
          /* Mobile (< 768px): Centered in screen with clean margin */
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-1.75rem)] sm:max-w-md rounded-[26px]",
          /* Tablet (768px - 1023px): Bottom-Sheet docked at bottom, fully visible and elevated */
          "md:top-auto md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:translate-y-0 md:max-w-xl md:max-h-[86vh] md:rounded-t-[30px] md:rounded-b-none md:border-b-0 md:shadow-[0_-16px_50px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.6)]",
          /* Desktop (>= 1024px): Perfectly centered */
          "lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-lg lg:rounded-[26px] lg:border lg:shadow-[0_25px_65px_-12px_rgba(15,23,42,0.24)]",
          /* Animation states */
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          /* Tablet slide-up animation */
          "md:data-open:slide-in-from-bottom-8 md:data-closed:slide-out-to-bottom-8",
          className
        )}
        {...props}
      >
        {/* Tablet drag handle bar indicator */}
        <div className="hidden md:flex lg:hidden w-full items-center justify-center pt-3 pb-1 shrink-0">
          <span className="h-1.5 w-12 rounded-full bg-slate-300/80 hover:bg-slate-400 transition-colors" />
        </div>

        {children}

        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3.5 end-3.5 sm:top-4 sm:end-4 size-8 rounded-full bg-black/[0.03] text-muted-foreground hover:bg-black/10 hover:text-foreground touch-target z-20 transition-all border border-black/5"
              size="icon-sm"
            >
              <XIcon className="size-4" />
              <span className="sr-only">إغلاق</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1.5 px-6 pt-5 pb-3.5 sm:px-7 sm:pt-6 sm:pb-4 pe-14 text-start shrink-0 border-b border-black/[0.05] bg-gradient-to-b from-white/60 to-transparent",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "mt-auto flex flex-col-reverse gap-2.5 border-t border-black/[0.06] bg-slate-50/70 backdrop-blur-md px-6 py-4 sm:px-7 sm:py-4.5 sm:flex-row sm:justify-end shrink-0 md:rounded-b-none lg:rounded-b-[26px] rounded-b-[26px]",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline" className="rounded-full h-11 px-5 border-black/10 hover:bg-black/5 touch-target">إغلاق</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-[17px] font-bold leading-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[13px] text-muted-foreground leading-relaxed *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
