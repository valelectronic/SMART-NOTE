import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import ClientProviders from "@/components/layout/clientProvider";
import { ProfileData } from "@/context/user.context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMART-NOTE",
  description: "lets handle your lesson notes.",
};

async function getInitialProfileData(): Promise<ProfileData> {
  // Replace with your actual fetch logic later
  return {
    fullName: "Loading User",
    fileUrl: null,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialProfile = await getInitialProfileData();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${space.variable} font-sans bg-paper text-ink antialiased`}
      >
        <ClientProviders initialProfile={initialProfile}>
          <Header />
          <main className="mt-[64px] px-4">{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
