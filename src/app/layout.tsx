import type { Metadata } from "next";
import { NavigationProgress } from "../components/navigation-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dukaan",
  description: "Build a beautiful online store in minutes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><NavigationProgress />{children}</body></html>;
}
