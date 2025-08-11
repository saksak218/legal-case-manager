import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import ToastProvider from "../components/ToastProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legal Case Manager",
  description: "Professional case management system for legal practitioners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.className} bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider />
            <TooltipProvider>
              <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
                <Navbar />
                <main className="mx-auto px-4 py-8 max-w-7xl container">
                  <div className="bg-white/70 shadow-2xl backdrop-blur-sm p-8 border border-white/20 rounded-3xl">
                    {children}
                  </div>
                </main>
              </div>
            </TooltipProvider>
            {/* </SignedIn> */}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
