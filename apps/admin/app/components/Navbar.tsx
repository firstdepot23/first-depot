"use client";

import { LogOut, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { useSignOut } from "../lib/useSignOut";
import { displayNameOf, emailOf, initialsOf } from "../lib/userDisplay";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile } = useClerk();
  const { signOut, signingOut } = useSignOut();

  const name = user ? displayNameOf(user) : "";
  const email = user ? emailOf(user) : "";

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background z-10">
      {/* LEFT */}
      <SidebarTrigger />
      {/* <Button variant="outline" onClick={toggleSidebar}>
        Custom Button
      </Button> */}
      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <Link href="/">Dashboard</Link>
        {/* THEME MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* USER MENU: the signed-in user */}
        {!isLoaded ? (
          // Clerk is still loading the session: a placeholder, not a wrong name.
          <div
            aria-busy="true"
            className="size-8 animate-pulse rounded-full bg-muted"
          />
        ) : !isSignedIn || !user ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open user menu"
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar>
                <AvatarImage src={user.imageUrl} alt={name} />
                <AvatarFallback>{initialsOf(name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={10}
              align="end"
              className="min-w-56"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {email && email !== name && (
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => openUserProfile()}>
                <User className="h-[1.2rem] w-[1.2rem] mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={signingOut}
                onSelect={(event) => {
                  event.preventDefault(); // keep the menu open so "Signing out..." shows
                  void signOut();
                }}
              >
                <LogOut className="h-[1.2rem] w-[1.2rem] mr-2" />
                {signingOut ? "Signing out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
