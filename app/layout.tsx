import type { Metadata, Viewport } from "next";
import { Baloo_Da_2, Hind_Siliguri } from "next/font/google";
import { MotionProvider } from "@/components/app/MotionProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const baloo = Baloo_Da_2({
  variable: "--font-baloo",
  subsets: ["bengali", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "জীবন নিয়া খেলা — ঢাকাইয়া জীবনের লাইফ সিমুলেশন",
    template: "%s · জীবন নিয়া খেলা",
  },
  description:
    "জীবন নিয়া খেলা — ঢাকাইয়া ভাষায় ফ্রি লাইফ সিমুলেশন গেম। জন্ম থেইকা মৃত্যু, ক্যারিয়ার, সম্পর্ক আর মাইঙ্কা চিপার সব রোমাঞ্চকর কাহিনি!",
  applicationName: "Jibon Niye Khela",
  keywords: ["life simulation", "life sim", "jibon niye khela", "dhakaiya bangla", "browser game", "জীবন নিয়া খেলা", "ঢাকাইয়া গেম"],
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
      lang="bn"
      className={`${baloo.variable} ${hind.variable} ${hind.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}