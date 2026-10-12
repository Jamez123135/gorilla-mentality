import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/app/lib/auth-config";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAuthConfigured()) redirect("/login");
  await auth.protect();
  return <DashboardShell>{children}</DashboardShell>;
}
