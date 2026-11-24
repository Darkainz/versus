"use client";

import { usePathname, useRouter } from "next/navigation";

export function DiffToggle({ checked, codes }: { checked: boolean; codes: readonly string[] }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          const query = new URLSearchParams();
          if (codes.length > 0) query.set("p", codes.join(","));
          if (event.currentTarget.checked) query.set("diff", "1");
          const serialized = query.toString();
          router.replace(`${pathname}${serialized ? `?${serialized}` : ""}`, { scroll: false });
        }}
        className="size-5 accent-accent"
      />
      Afficher uniquement les différences
    </label>
  );
}
