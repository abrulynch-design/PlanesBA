import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Inbox' },
  { href: '/new', label: 'Add Plan' },
  { href: '/settings', label: 'Settings' }
];

export default function NavBar() {
  return (
    <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-white px-6 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Planes BA</p>
        <h1 className="text-2xl font-semibold text-ink">Turn plans into calendar events</h1>
      </div>
      <nav className="flex flex-wrap gap-3 text-sm font-medium">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
