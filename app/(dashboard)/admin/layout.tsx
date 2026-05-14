import { AdminDashboardClientShell } from "@/components/dashboard/AdminDashboardClientShell";
import { requireRole } from "@/lib/auth/getUserProfile";

export default async function AdminSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("admin");
  return <AdminDashboardClientShell>{children}</AdminDashboardClientShell>;
}
