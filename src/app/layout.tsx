import type { Metadata } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/newsreader";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroDiver — Focus, with company",
  description:
    "Body-doubling sessions and gentle energy support, designed for neurodivergent minds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
