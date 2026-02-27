"use client";

import { useState } from "react";
import { X, Crown, FileText, Printer, Download, RefreshCw, Zap, Check, Loader2 } from "lucide-react";
import Script from "next/script";
import { toast } from "sonner";
import { useSession } from "@/lib/db/auth.client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: string | null;
}

export function UpgradeModal({ isOpen, onClose, feature }: Props) {
  const { data: session } = useSession();
  const [isInitializing, setIsInitializing] = useState(false);

  const handlePayment = () => {
    if (!session?.user) {
      toast.error("User session not found. Please log in.");
      return;
    }

    setIsInitializing(true);

    if (!(window as any).PaystackPop) {
      toast.error("Payment system is loading, please try again.");
      setIsInitializing(false);
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: session.user.email,
      amount: 300000,
      currency: "NGN",
      metadata: { userId: session.user.id },
      callback: () => {
        setIsInitializing(false);
        toast.success("Payment successful! Upgrading your account...");
        onClose();
        setTimeout(() => window.location.reload(), 2000);
      },
      onClose: () => {
        setIsInitializing(false);
        toast.info("Payment cancelled");
      },
    });

    handler.openIframe();
  };

  if (!isOpen) return null;

  const featureMessages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    print: {
      title: "Print Feature Locked",
      description: "Print your lesson notes in professional format for classroom use.",
      icon: <Printer size={15} />,
    },
    download: {
      title: "PDF Export Locked",
      description: "Download high-quality PDF copies for offline access and sharing.",
      icon: <Download size={15} />,
    },
    regenerate: {
      title: "Regeneration is Premium",
      description: "Generate multiple versions of the same topic for variety and comparison.",
      icon: <RefreshCw size={15} />,
    },
    generation: {
      title: "Note Limit Reached",
      description: "You've used your 5 free notes. Upgrade for full term generations.",
      icon: <FileText size={15} />,
    },
    refinement: {
      title: "Refinement Limit Reached",
      description: "You've used all 2 free edits. Upgrade for 3 edits per note.",
      icon: <Zap size={15} />,
    },
  };

  const perks = [
    { icon: <FileText size={14} />, label: "Note Generations", free: "5 notes", premium: "15 notes / term" },
    { icon: <RefreshCw size={14} />, label: "Regenerations",   free: "None",    premium: "1 per note" },
    { icon: <Zap size={14} />,      label: "Refinements",      free: "2 / note", premium: "3 per note" },
    { icon: <Printer size={14} />,  label: "Print & PDF",      free: "Locked",  premium: "Unlimited" },
  ];

  const current = feature ? featureMessages[feature] : null;

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Sheet */}
        <div
          className="relative w-full max-w-sm sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 shrink-0" />

          {/* Drag pill — mobile only */}
          <div className="flex justify-center pt-2.5 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-5 pt-4 pb-6 sm:px-7 sm:pt-6 sm:pb-8 space-y-5">

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            >
              <X size={18} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  {current?.title ?? "Unlock Premium"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full term access · Instant activation
                </p>
              </div>
            </div>

            {/* Feature-specific callout */}
            {current && (
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-3.5 py-3">
                <span className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0">
                  {current.icon}
                </span>
                <p className="text-xs sm:text-sm text-foreground/80 leading-snug">
                  {current.description}
                </p>
              </div>
            )}

            {/* Comparison table */}
            <div className="rounded-2xl border border-border overflow-hidden text-xs sm:text-sm">
              {/* Header */}
              <div className="grid grid-cols-3 bg-muted/60 px-3 py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center text-amber-600 dark:text-amber-400">Premium</span>
              </div>
              {/* Rows */}
              {perks.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 items-center px-3 py-2.5 gap-1 ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                    <span className="text-primary shrink-0">{p.icon}</span>
                    <span className="leading-tight">{p.label}</span>
                  </div>
                  <span className="text-center text-muted-foreground">{p.free}</span>
                  <span className="text-center font-semibold text-amber-600 dark:text-amber-400">
                    {p.premium}
                  </span>
                </div>
              ))}
            </div>

            {/* Price card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/30 px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-foreground">₦3,000</p>
                <p className="text-xs text-muted-foreground">per term · one-time</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Best Value
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check size={11} className="text-green-500" /> Secure · Paystack
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handlePayment}
                disabled={isInitializing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isInitializing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={16} className="fill-white" />
                    Pay ₦3,000 Now
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={isInitializing}
                className="w-full border border-border hover:bg-muted active:scale-95 rounded-2xl py-3 font-medium text-muted-foreground transition-all text-sm disabled:opacity-50"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground italic">
              Secure payment powered by Paystack
            </p>

          </div>
        </div>
      </div>
    </>
  );
}