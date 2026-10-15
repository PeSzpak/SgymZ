import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-[transform,background-color,color,box-shadow,opacity] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 rounded-pill",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground hover:bg-accent-strong [clip-path:var(--button-clip)] kitty:border-2 kitty:border-outline kitty:shadow-[3px_3px_0_var(--outline)] kitty:active:shadow-[1px_1px_0_var(--outline)] kitty:hover:bg-accent",
        secondary:
          "bg-muted text-foreground hover:bg-card-2 border border-border kitty:border-2 kitty:border-outline",
        outline: "border-2 border-accent bg-transparent text-accent hover:bg-accent-soft",
        ghost: "text-foreground hover:bg-accent-soft hover:text-accent",
        destructive: "bg-danger text-white hover:opacity-90",
        link: "text-accent underline-offset-4 hover:underline px-0! h-auto!",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-14 px-7 text-base",
        icon: "h-11 w-11 shrink-0",
        "icon-sm": "h-9 w-9 shrink-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
