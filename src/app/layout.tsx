import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Self-hosting the fonts to avoid 404 errors
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  preload: true,
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta-sans",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: "Nova Search - Modern Web Search Engine",
  description: "A fast, clean, and modern web search experience",
  icons: {
    icon: [
      {
        url: "/nova-logo.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jakartaSans.variable}`}>
      <body className={`bg-white dark:bg-black text-black dark:text-white font-jakarta ${jakartaSans.className}`}>
        {children}
      </body>
    </html>
  );
}
