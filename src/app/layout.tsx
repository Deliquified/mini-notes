import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { Providers } from "./components/providers/providers";
import icon from "@/public/logo.png"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Notes On-Chain",
  description: "Notes On-Chain is a privacy-focused note-taking application built for the LUKSO ecosystem, designed to store and reference your notes securely with IPFS and LUKSO's Universal Profiles while keeping the content private and accessible only to you. By leveraging Universal Profiles and LSP2 metadata, your notes move with your digital identity, always available wherever you go.",
  icons: {
    icon: icon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
