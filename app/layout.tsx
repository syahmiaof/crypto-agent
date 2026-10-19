import type { Metadata } from "next";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = {
  metadataBase: new URL("https://cryptoai.syahmiaof.my"),
  title: "Crypto AI · Mission Control | Autonomous Trading Intelligence",
  description:
    "Intelligent Markets. Coordinated Agents. Controlled Decisions. Institutional multi-agent cryptocurrency trading command center.",
  openGraph: {
    title: "Crypto AI · Mission Control",
    description: "Intelligent Markets. Coordinated Agents. Controlled Decisions.",
    url: "https://cryptoai.syahmiaof.my",
    siteName: "Crypto AI Mission Control",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Crypto AI Mission Control Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto AI · Mission Control",
    description: "Intelligent Markets. Coordinated Agents. Controlled Decisions.",
    images: ["/og-image.jpg"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
