"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/db/auth.client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/" });
    } catch (err) {
      console.error(err);
      // optional: toast.error("Sign-in failed");
      toast.error("Sign-in failed");
    } finally {
      setLoading(false); // reset in case user cancels popup
      
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={loading}
      className="w-full bg-primary text-primary-foreground 
                 hover:bg-primary/90 active:ring-2 active:ring-primary 
                 py-3 text-sm sm:text-base font-medium rounded-md
                 transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign in with Google"
      )}
    </Button>
  );
}