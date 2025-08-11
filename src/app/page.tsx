import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  return redirect("/clients");
}
