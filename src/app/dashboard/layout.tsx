import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import BottomNav from "@/components/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const user = await getUserById(session.userId);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      {children}
      <BottomNav role="agent" />
    </div>
  );
}
