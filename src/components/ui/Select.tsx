import type { ComponentProps, ReactNode } from "react";

type SelectProps = Omit<ComponentProps<"select">, "id"> & {
  id: string;
  label: string;
  children: ReactNode;
};

export function Select({ id, label, children, className = "", ...props }: SelectProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium">
      {label}
      <select
        id={id}
        className={`min-h-11 rounded-option border border-line bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
