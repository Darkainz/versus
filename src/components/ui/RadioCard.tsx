import type { ComponentProps } from "react";

type RadioCardProps = Omit<ComponentProps<"input">, "type"> & {
  title: string;
  description: string;
};

export function RadioCard({ title, description, className = "", ...props }: RadioCardProps) {
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-option border border-line-soft bg-surface p-4 has-checked:border-accent has-checked:ring-1 has-checked:ring-accent ${className}`}
    >
      <input
        type="radio"
        className="mt-1 size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        {...props}
      />
      <span className="grid gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm font-normal text-muted">{description}</span>
      </span>
    </label>
  );
}
