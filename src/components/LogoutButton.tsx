"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm text-gray-500 transition-colors hover:text-red-500"
      title="Déconnexion"
      aria-label="Déconnexion"
    >
      <LogOut size={20} />
    </button>
  );
}
