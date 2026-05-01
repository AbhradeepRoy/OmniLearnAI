import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniLearn AI - Your AI Learning Assistant",
  description: "OmniLearn AI - Your personal AI-powered learning assistant for academic success",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-50">
      <body className="font-sans">{children}</body>
    </html>
  );
}
