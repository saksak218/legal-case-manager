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
import { ThemeProvider } from "@/components/ThemeProvider"; // Add if Shadcn init creates it

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legal Case Manager",
  description: "Manage clients and cases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider />
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
            <SignedIn>
              <Navbar />
              <main className="mx-auto p-4 container">{children}</main>
            </SignedIn>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
