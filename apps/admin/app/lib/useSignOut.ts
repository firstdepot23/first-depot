"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { toast } from "react-toastify";

// One sign-out behaviour for every menu in the admin (sidebar and navbar).
export const useSignOut = () => {
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // Ends the session, then sends the browser to the sign-in page.
      await signOut({ redirectUrl: "/sign-in" });
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Couldn't sign you out. Please try again.");
      setSigningOut(false);
    }
  };

  return { signOut: handleSignOut, signingOut };
};