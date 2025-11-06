"use client";

import { signOut, useSession } from "@/lib/db/auth.client";
import { Bell, Home, LogOut, Menu, Shield, Settings, User, X ,BadgeCheck, NotebookText, BookOpenText} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ThemeToggle from "../theme/ThemeToggle";

import Image from "next/image";

import { useUser } from "@/context/user.context";






export default function Header() {

  const { profile } = useUser();

  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const { data: session, isPending } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    setDrawer(false);
    await signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  };

  const close = () => setDrawer(false);

  // 1. Get the image URL from context, fall back to session, then default
const avatarUrl = profile?.fileUrl?.trim() || user?.image || "/logo.jpg";


// 2. Get initials from context name, fall back to session name, then default
const initials = (profile?.fullName || user?.name)
  ? (profile?.fullName || user?.name)
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
  : "U";

  /* ---------- Navigation items ---------- */
 const navItems = !isPending && user
  ? isAdmin
    ? [
        { label: "My Control", href: "/admin/control-room", icon: Shield },
        { label: "Post Approval", href: "/admin/post-approval", icon: BadgeCheck },
      ]
    : [
        { label: "lesson Note", href: "/community/lessonNote", icon: BookOpenText },
        { label: "scheme of work", href: "/community/schemeOfWork", icon: NotebookText },
        { label: "Settings", href: "/profile-settings", icon: Settings },
        { label: "Profile", href: "/community/profile", icon: User },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ]
  : [];

  /* ---------- Mobile header icons (20 px + pill bg) ---------- */
 const MobileIcons = () => (
  <div className="flex items-center gap-3">
    {/* Theme toggle - always visible */}
    <ThemeToggle />

    {/* scheme of work - only when logged in */}
    {user && (
      <>
        <Link href="/community/schemeOfWork" onClick={close} aria-label="Settings">
          <div className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
            <NotebookText className="h-5 w-5" />
          </div>
        </Link>
      </>
    )}
  </div>
);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between px-3">
          {/* LEFT: hamburger + logo + app name */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawer(true)}
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                          <Image
            src="/logo.jpg"      // image file in /public directory
            alt="My logo"        // always required for accessibility
            width={25}          // required: width in px
            height={25}         // required: height in px
            className="w-5 h-5 rounded-full"
          />

              </div>
              <span className="font-display font-bold text-lg text-foreground">SMARTNOTE</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-foreground hover:text-primary transition-colors",
                  pathname === item.href && "text-primary underline"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: desktop dropdown | mobile icon row + login */}
          <div className="flex items-center gap-4">
            {/* Desktop dropdown (avatar + logout) */}
            <div className="hidden md:flex items-center gap-4">
               <ThemeToggle />
              {isPending ? null : user ? (
                            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/** 👇 ONLY ONE CHILD ELEMENT ALLOWED */}
                <Button variant="ghost" className="rounded-full h-9 w-9 p-0">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage
                      src={avatarUrl}
                      alt={user.name ?? "User"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex flex-col">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

              ) : (
                <Link href="/login">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                </Link>
              )}
            </div>

            {/* Mobile-only icon row (24 px icons + pill bg) */}
            <div className="flex md:hidden items-center gap-3">
              <MobileIcons />
              {!user && !isPending && (
                <Link href="/login">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                </Link>
                
        
              )}

             
            </div>
          </div>
        </div>
      </header>
      
<div className="h-1 bg-gradient-to-r from-teal-500 to-purple-500 sticky top-16 z-30" />

      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={close} />
          <div className="fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 md:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display font-bold text-lg text-foreground">Menu</span>
              <Button variant="ghost" size="icon" onClick={close} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

           {user && (
      <Card
        className="mx-4 my-3 p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => {
          close();
          router.push("/community/profile");
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
          <AvatarImage 
            src={avatarUrl} // Use the context-derived URL
            alt={user.name ?? "User"} 
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials} 
          </AvatarFallback>
        </Avatar>
          {/* Name*/}
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">{user.name}</p>
          </div>

          {/* App logo (right side) */}
          <div className="p-2 rounded-full bg-primary text-primary-foreground">
                           <Image
            src="/logo.jpg"      // image file in /public directory
            alt="My logo"        // always required for accessibility
            width={20}          // required: width in px
            height={20}         // required: height in px
            className="w-5 h-5 rounded-full"
          />
          </div>
        </div>
      </Card>
    )}
                        <nav className="flex-1 px-4 py-3 space-y-2">
            {/* PUBLIC - always visible */}
         {/* Dashboard - active highlight */}
            <Link
              href="/"
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {/* Theme - active highlight (optional) */}
          <div
  className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
    "text-foreground hover:bg-secondary hover:text-primary"
  )}
>
  <ThemeToggle />
  <span>Theme</span>
</div>


            {/* AUTH-ONLY links (no Dashboard/Theme) */}
            {user &&
              navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary hover:text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

            {/* LOGIN / LOGOUT button at bottom */}
            {user ? (
              <div className="mt-auto pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-border">
                <Link href="/login" onClick={close}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </nav>
          </div>

        </>

        
      )}
    </>
  );
}