import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/app/MotionProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jibon Niye Khela — A Life Simulation",
    template: "%s · Jibon Niye Khela",
  },
  description:
    "Jibon Niye Khela is a free, browser-based life simulation game. Live a whole life one year at a time, chase careers and relationships, and see how the story ends.",
  applicationName: "Jibon Niye Khela",
  keywords: ["life simulation", "life sim", "jibon niye khela", "browser game"],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9e2a2b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}