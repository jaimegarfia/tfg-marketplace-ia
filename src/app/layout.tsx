import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Certia — Marketplace seguro de Agentes de IA",
    template: "%s · Certia",
  },
  description:
    "Plataforma agnóstica para la comercialización y certificación segura de Agentes de IA. Seguridad por diseño y auditoría en sandbox.",
  applicationName: "Certia",
  authors: [{ name: "TFG — Marketplace de Agentes de IA" }],
  keywords: [
    "Agentes de IA",
    "marketplace",
    "certificación",
    "ciberseguridad",
    "sandbox",
    "auditoría",
  ],
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
