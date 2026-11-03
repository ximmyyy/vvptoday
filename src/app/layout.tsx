import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Barlow_Condensed, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic"], weight: ["500", "600"], variable: "--font-playfair" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-barlow" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Goal van de Maand | VV Pernis",
  description: "Stem op de mooiste goal van de maand van VV Pernis.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = { themeColor: "#0b0c0f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${playfair.variable} ${barlow.variable} ${inter.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-40 bg-page/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VV Pernis" width={44} height={44} className="h-10 w-10 sm:h-11 sm:w-11" />
              <span className="leading-none">
                <span className="font-caps block text-sm text-muted">V.V. Pernis</span>
                <span className="font-display block whitespace-nowrap text-lg sm:text-xl">Goal van de Maand</span>
              </span>
            </Link>
            <nav className="font-caps flex gap-4 text-sm sm:gap-5 sm:text-base">
              <Link href="/" className="hover:text-orange">Stemmen</Link>
              <Link href="/archief" className="hover:text-orange">Winnaars</Link>
            </nav>
          </div>
          <div className="club-stripe h-1" />
        </header>
        <main className="flex-1">{children}</main>
        <footer className="px-4 py-8 text-center text-xs text-muted">
          <div className="club-stripe mx-auto mb-6 h-1 w-16 rounded-full" />
          © {new Date().getFullYear()} V.V. Pernis · Je e-mailadres wordt alleen gebruikt om je stem te controleren.
        </footer>
      </body>
    </html>
  );
}
