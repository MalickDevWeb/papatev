import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: "SEN AURA TECH",
  description: "Solutions numériques, infrastructures, formations et marketplace au Sénégal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}