import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Thadata | AI-Powered Data Analytics",
  description: "The autonomous AI data analyst. Upload data, ask questions, get instant insights and strategic reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0d0d0d] text-white`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
