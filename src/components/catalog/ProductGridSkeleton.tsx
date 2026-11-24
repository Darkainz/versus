import { Skeleton } from "@/components/ui/Skeleton";

export function ProductGridSkeleton() {
  return (
    <section aria-label="Chargement du catalogue" aria-busy="true" className="wrap py-10">
      <Skeleton className="h-10 w-56" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="rounded-tile border border-line-soft p-5">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-5 h-5 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-6 h-11 w-36" />
          </li>
        ))}
      </ul>
    </section>
  );
}
