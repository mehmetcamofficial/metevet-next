import Link from "next/link";

const links = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/owners", label: "Hayvan Sahipleri" },
  { href: "/admin/pets", label: "Hayvanlar" },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-[#0d2922]/10 bg-[#0d2922] px-4 py-4 text-white lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0 lg:px-5 lg:py-7">
      <Link href="/admin" className="rounded-md text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cda85f]">MeteVet</Link>
      <p className="mt-1 text-xs text-white/65">Yönetim Paneli</p>
      <nav aria-label="Yönetim menüsü" className="mt-5 flex gap-2 overflow-x-auto lg:flex-col">
        {links.map((link) => <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#cda85f]">{link.label}</Link>)}
      </nav>
    </aside>
  );
}
