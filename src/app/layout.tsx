import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeApplier } from "@/components/docura/theme-applier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOCURA — Premium DOCX → PDF Converter",
  description:
    "Drop in a Word document, customize the output, and download a beautiful PDF. Premium, privacy-conscious, fast.",
  keywords: ["DOCX to PDF", "Word to PDF", "document converter", "PDF", "DOCX"],
  authors: [{ name: "DOCURA" }],
  applicationName: "DOCURA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "DOCURA — Premium DOCX → PDF Converter",
    description: "Convert Word documents to beautiful PDFs. Fast, private, premium.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DOCURA",
    description: "Premium DOCX → PDF converter.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        <ThemeApplier />
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" />
      </body>
    </html>
  );
}
