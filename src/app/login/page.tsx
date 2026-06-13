"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center">
      <h1 className="font-serif text-[32px] lg:text-[42px] font-normal mb-2">
        Daily <em className="italic text-accent-buffer">OS</em>
      </h1>
      <p className="text-muted text-sm mb-8 max-w-[420px] leading-[1.6]">
        Recovery-aware scheduling powered by your Whoop data.
      </p>

      {error && (
        <div className="bg-[#2d0d0d] border border-[#5c1a1a] text-red rounded-lg p-3 mb-6 text-sm max-w-[400px]">
          Authentication failed. Please try again.
        </div>
      )}

      <div className="bg-surface border border-border rounded-[14px] p-8 w-full max-w-[400px]">
        <a
          href="/api/auth/signin/whoop"
          className="block w-full py-3.5 rounded-[10px] bg-accent-buffer text-bg font-semibold text-sm text-center no-underline active:opacity-80 transition-opacity"
        >
          Sign in with WHOOP
        </a>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted font-mono uppercase">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <a
          href="/?skip=true"
          className="block w-full py-3 rounded-[10px] bg-transparent border border-border text-muted text-[13px] text-center no-underline active:border-muted transition-colors"
        >
          Use without account
        </a>
      </div>

      <p className="mt-6 text-[11px] text-dot max-w-[380px] leading-[1.5]">
        Signing in with WHOOP enables automatic recovery detection, push notifications, and cloud-synced schedules.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-border border-t-accent-buffer rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
