export function Skeleton({ className = "", ...props }: React.ComponentProps<"div">) {
  return <div className={`animate-pulse rounded-md bg-muted/20 ${className}`} {...props} />;
}
