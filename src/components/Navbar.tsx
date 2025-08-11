"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center bg-blue-600 p-4 text-white">
      <div className="flex gap-4 mx-auto container">
        <Link href="/clients">Clients</Link>
        <Link href="/today-cases">Today's Cases</Link>
      </div>

      <div>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}

// <SignedOut>
//   <SignInButton>
//     <button className="bg-blue-900 hover:bg-blue-950 cursor-pointer">
//       Login
//     </button>
//   </SignInButton>
//   {/* <SignUpButton>
//     <button className="bg-[#6c47ff] px-4 sm:px-5 rounded-full h-10 sm:h-12 font-medium text-ceramic-white text-sm sm:text-base cursor-pointer">
//       Sign Up
//     </button>
//   </SignUpButton> */}
// </SignedOut>
// <SignedIn>
//   <UserButton />
// </SignedIn>
