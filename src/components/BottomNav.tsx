"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Wallet, Users, LayoutDashboard } from "lucide-react";

interface BottomNavProps {
  role?: "admin" | "agent";
}

const agentLinks = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/dashboard/prospects", icon: Users, label: "Prospects" },
  { href: "/dashboard/performance", icon: BarChart3, label: "Performance" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Portefeuille" },
];

const adminLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Admin" },
  { href: "/admin/agents", icon: Users, label: "Agents" },
];

export default function BottomNav({ role = "agent" }: BottomNavProps) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : agentLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md">
      <div className="mx-4 mb-4 flex items-center justify-around rounded-3xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-all ${
                active ? "bg-primary text-white" : "text-gray-400 hover:text-primary"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
