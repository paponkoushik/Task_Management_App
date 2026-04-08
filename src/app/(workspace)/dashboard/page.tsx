import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardViewModel } from "@/services/task-orbit-service";
import { DashboardShell } from "./_components/dashboard-shell";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const dashboard = await getDashboardViewModel(currentUser);

  return <DashboardShell {...dashboard} />;
}
