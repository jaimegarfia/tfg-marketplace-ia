import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de Control del Desarrollador",
};

export default function DeveloperDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
