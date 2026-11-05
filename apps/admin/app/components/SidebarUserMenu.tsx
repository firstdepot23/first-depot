"use client";

import { useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronsUpDown, LogOut, UserCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "./ui/sidebar";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "?";

// The signed-in user at the bottom of the sidebar: their real name, email and
// photo from Clerk, and a working menu (Account, Sign out).
const SidebarUserMenu = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { isMobile } = useSidebar();
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

  // Clerk is still loading the session: show a placeholder, not a wrong name.
  if (!isLoaded) {
    return (
      <SidebarMenuButton size="lg" disabled aria-busy="true">
        <div className="size-8 shrink-0 animate-pulse rounded-lg bg-sidebar-accent" />
        <div className="h-3 w-24 animate-pulse rounded bg-sidebar-accent" />
      </SidebarMenuButton>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SidebarMenuButton size="lg" asChild>
        <Link href="/sign-in">
          <LogOut />
          <span>Sign in</span>
        </Link>
      </SidebarMenuButton>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name = user.fullName || user.username || email || "Signed-in user";

  const identity = (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={user.imageUrl} alt={name} />
        <AvatarFallback className="rounded-lg">
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        {email && email !== name && (
          <span className="truncate text-xs text-muted-foreground">
            {email}
          </span>
        )}
      </div>
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {identity}
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {identity}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openUserProfile()}>
          <UserCircle />
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault(); // keep the menu open so "Signing out..." shows
            void handleSignOut();
          }}
        >
          <LogOut />
          {signingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarUserMenu;
