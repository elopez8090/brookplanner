import { DashboardWorkspaceLayout } from "@/components/dashboard/DashboardWorkspaceLayout";
import { requireRole } from "@/lib/auth/getUserProfile";

export default async function VendorSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("vendor");
  return <DashboardWorkspaceLayout workspace="vendor">{children}</DashboardWorkspaceLayout>;
}
