export function Stepper({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol aria-label="Étapes de la commande" className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className="min-w-0 border-t-2 border-line-soft pt-2 text-xs break-words text-muted aria-[current=step]:border-accent aria-[current=step]:font-semibold aria-[current=step]:text-ink sm:text-sm"
        >
          <span className="mr-1 tabular-nums">{index + 1}.</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
