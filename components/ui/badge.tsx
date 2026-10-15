import { cn } from "@/lib/utils";

const tones = {
  accent: "bg-accent-soft text-accent",
  muted: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  mint: "bg-secondary/40 text-secondary-foreground bat:bg-secondary/50 bat:text-foreground",
};

export function Badge({
  tone = "accent",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
