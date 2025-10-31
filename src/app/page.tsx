// src/app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name}</h1>
      <p className="text-gray-500 mt-2">Your onboarding is complete.</p>
    </main>
  );
}