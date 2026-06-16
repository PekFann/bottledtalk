import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BottledTalk — Message Bottles on the Map",
  description:
    "Drop message bottles at your location and discover conversations within 2km.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
