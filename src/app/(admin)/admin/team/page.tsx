import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getAdminConfig, getOwnerEmails } from "@/lib/admin-store";
import { TeamManager } from "./team-manager";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.role) redirect("/admin/login");
  if (session.user.role !== "owner") redirect("/admin");

  const config = await getAdminConfig();
  const owners = getOwnerEmails();

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-brand-darkest">Team</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Manage who can access the admin panel. Managers can edit products and
        videos but cannot manage the team.
      </p>
      <TeamManager owners={owners} managers={config.managers} />
    </AdminShell>
  );
}
