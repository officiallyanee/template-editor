import type { ComponentPropsWithRef, ReactNode } from "react";
type Props = ComponentPropsWithRef<"button"> & {
  tone?: "default" | "primary" | "danger" | "inverse";
  children: ReactNode;
};
export function Button({
  tone = "default",
  className = "",
  children,
  ...props
}: Props) {
  const tones = {
    default:
      "border-border-default bg-raised text-ink-secondary hover:border-ink-faint hover:bg-surface-hover",
    primary:
      "rounded-full border-primary bg-primary px-4 py-2.5 text-on-primary hover:border-primary-active hover:bg-primary-active",
    danger:
      "border-danger-border bg-danger-surface text-danger hover:border-danger",
    inverse:
      "border-preview-chrome-border bg-preview-chrome-control text-preview-chrome-text hover:bg-preview-chrome-hover",
  };
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:border-hairline disabled:bg-canvas-soft disabled:text-ink-faint disabled:transform-none ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
