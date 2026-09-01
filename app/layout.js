import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LinkedIn Profile API | Reverse-Engineered Voyager REST API",
  description: "A fast, headless-browser-free hosted REST API for extracting structured LinkedIn profile data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
