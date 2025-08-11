"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  UserProfile,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // For hamburger icons

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  console.log(user);

  const links = [
    { href: "/clients", label: "Clients" },
    { href: "/today-cases", label: "Today's Cases" },
  ];

  return (
    <nav className="top-0 z-50 sticky bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="flex justify-between items-center mx-auto px-6 py-3 container">
        {/* Logo / Brand */}
        <div className="font-bold text-white hover:text-pink-300 text-xl tracking-wide transition">
          <Link href="/">Case Manager</Link>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 
                ${
                  pathname === href
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "text-gray-200 hover:bg-white/10 hover:text-white"
                }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons (Desktop) */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            className="sm:hidden text-white hover:text-pink-300 transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          {/* <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-white transition">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-pink-500 hover:bg-pink-600 px-4 py-1.5 rounded-lg transition">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut> */}

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </div>

      {/* Mobile Menu (Slide Down) */}

      {isOpen && (
        <div className="md:hidden fixed space-y-4 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 pb-4 w-full max-w-full">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 
                ${
                  pathname === href
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "text-gray-200 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}

          {/* Auth Buttons (Mobile) */}
        </div>
      )}
    </nav>
  );
}
