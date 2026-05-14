import { DashboardWorkspaceLayout } from "@/components/dashboard/DashboardWorkspaceLayout";
import { requireRole } from "@/lib/auth/getUserProfile";

export default async function CustomerSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("customer");
  return <DashboardWorkspaceLayout workspace="customer">{children}</DashboardWorkspaceLayout>;
}
