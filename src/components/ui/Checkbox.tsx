import type { ComponentProps } from "react";

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="inline-flex min-h-11 items-center gap-3 text-sm font-medium">
      <input
        type="checkbox"
        className={`size-5 rounded border-line accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
