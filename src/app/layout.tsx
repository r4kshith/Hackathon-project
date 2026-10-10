import type { Metadata } from "next";
import { Bodoni_Moda, Cormorant_Garamond, DM_Sans, Manrope } from "next/font/google";
import { NavigationProgress } from "../components/navigation-progress";
import "./globals.css";

const bodoni = Bodoni_Moda({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-bodoni", display: "swap" });
const dmSans = DM_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const cormorant = Cormorant_Garamond({ weight: ["500", "600", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-old-money", display: "swap" });

export const metadata: Metadata = {
  title: "Dukaan",
  description: "Build a beautiful online store in minutes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${bodoni.variable} ${dmSans.variable} ${manrope.variable} ${cormorant.variable}`}><NavigationProgress />{children}</body></html>;
}
