import type { Metadata, Viewport } from "next";
import { Patrick_Hand } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
});

export const metadata: Metadata = {
  title: "BottledTalk — Message Bottles on the Map",
  description:
    "Drop message bottles at your location and discover conversations within 2km.",
  appleWebApp: {
    capable: true,
    title: "BottledTalk",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5ba3b8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={patrickHand.variable}>
      <body className="antialiased font-handwriting">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
