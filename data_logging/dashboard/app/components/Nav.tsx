"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Live" },
  { href: "/runs", label: "Runs" },
  { href: "/how-to-run", label: "Setup" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={`flex min-h-11 items-center border-b-2 px-4 ${
            pathname === link.href ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
