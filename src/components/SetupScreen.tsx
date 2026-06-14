"use client";

import { signIn } from "next-auth/react";

interface Props {
  onConnect: (token: string) => void;
  onSkip: () => void;
}

export default function SetupScreen({ onConnect: _onConnect, onSkip }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-5 text-center">
      <h1 className="font-serif text-[32px] font-normal mb-2">
        Daily <em className="italic text-accent-buffer">OS</em>
      </h1>
      <p className="text-muted text-sm mb-8 max-w-[420px] leading-[1.6]">
        Recovery-aware scheduling powered by your Whoop data.
      </p>

      <div className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[460px] lg:max-w-[520px] lg:p-8">
        <button
          onClick={() => signIn("whoop", { callbackUrl: "/" })}
          className="w-full py-3.5 border-none rounded-[10px] bg-accent-buffer text-bg font-semibold text-sm cursor-pointer active:opacity-80 transition-opacity"
        >
          Sign in with WHOOP
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted font-mono uppercase">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={onSkip}
          className="w-full py-3 rounded-[10px] bg-transparent border border-border text-muted text-[13px] cursor-pointer active:border-muted transition-colors"
        >
          Use without Whoop
        </button>
      </div>

      <p className="mt-5 text-[11px] text-dot max-w-[400px] leading-[1.5]">
        Signing in connects your recovery data so your schedule adapts to how you slept. Your data stays private.
      </p>
    </div>
  );
}
