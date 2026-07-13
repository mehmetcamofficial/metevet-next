import Link from "next/link";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[#687A75]">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition hover:text-[#123A30]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#123A30]">{item.label}</span>
          )}
          {index < items.length - 1 ? <span>/</span> : null}
        </div>
      ))}
    </nav>
  );
}
