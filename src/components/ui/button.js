import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  secondary:
    "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-900",
  outline:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-300",
  ghost: "text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-300",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function buttonStyles({ variant = "primary", size = "md", className } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
