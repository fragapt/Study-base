import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Base de Estudo",
  description: "Hub de estudo — drives, exames, notas e progresso por cadeira.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Base de Estudo",
  },
};

export const viewport: Viewport = {
  themeColor: "#191919",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
