import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Frigo Intelligent",
  description: "Réduisez le gaspillage alimentaire avec l'IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frigo Intel",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark scroll-smooth">
      <body className={`${outfit.variable} font-sans antialiased bg-background text-foreground selection:bg-emerald-500/30`}>
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
