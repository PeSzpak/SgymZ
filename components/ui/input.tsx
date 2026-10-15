import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full bg-input text-foreground border border-border rounded-theme px-3.5 text-base placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50 transition-colors kitty:border-2";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldBase, "h-12", className)} {...props} />
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, "min-h-24 py-3 resize-none", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, "h-12 appearance-none pr-10 bg-no-repeat", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 14px center",
      }}
      {...props}
    />
  )
);
Select.displayName = "Select";

export { Input, Textarea, Select, fieldBase };
