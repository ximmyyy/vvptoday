import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Goal van de Maand | VV Pernis",
  description: "Stem op de mooiste goal van de maand van VV Pernis.",
};

export const viewport: Viewport = { themeColor: "#0d2240" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${anton.variable} ${inter.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <header className="bg-club border-b-4 border-accent">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              {/* Vervang door het clublogo: zet logo.png in /public en gebruik <img src="/logo.png" /> */}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-accent-ink">
                VVP
              </span>
              <span className="font-display text-xl leading-none">
                VV Pernis
                <span className="block text-xs font-sans font-semibold normal-case tracking-normal text-accent">
                  Goal van de Maand
                </span>
              </span>
            </Link>
            <nav className="flex gap-4 text-sm font-semibold">
              <Link href="/" className="hover:text-accent">Stemmen</Link>
              <Link href="/archief" className="hover:text-accent">Winnaars</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} VV Pernis · Je e-mailadres wordt alleen gebruikt om je stem te controleren.
        </footer>
      </body>
    </html>
  );
}
