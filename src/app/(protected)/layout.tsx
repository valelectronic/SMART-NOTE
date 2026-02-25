import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session (Better-Auth is safe to use here)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. If not logged in at all, send to login
  if (!session?.user) {
    redirect("/login");
  }

  // 3. Admin bypass - Admins don't need to do onboarding
  const isAdmin = session.user.role === "admin";
  if (isAdmin) return <>{children}</>;

  // 4. Check the Database for Onboarding
  // This is safe because layouts use the 'nodejs' runtime
  const onboarded = await db.query.onboarding.findFirst({
    where: eq(onboarding.userId, session.user.id),
    columns: { id: true },
  });

  // 5. If they haven't onboarded, send them to the onboarding page
  if (!onboarded) {
    redirect("/onboarding");
  }

  // 6. If everything is fine, show the page!
  return <>{children}</>;
}