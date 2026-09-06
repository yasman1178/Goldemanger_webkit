import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/shared/lib/utils"

interface FabProps extends React.ComponentProps<"button"> {
  asChild?: boolean
}

function Fab({ className, asChild = false, ...props }: FabProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="fab"
      className={cn(
        "inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-6 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  )
}

export { Fab }
