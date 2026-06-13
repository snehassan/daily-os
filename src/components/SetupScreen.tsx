"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface Props {
  onConnect: (token: string) => void;
  onSkip: () => void;
}

export default function SetupScreen({ onConnect, onSkip }: Props) {
  const [showManual, setShowManual] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  function handleConnect() {
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please paste your Whoop token above.");
      return;
    }
    onConnect(trimmed);
  }

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
          Use without account
        </button>

        <button
          onClick={() => setShowManual(!showManual)}
          className="mt-4 w-full text-center text-[11px] text-dot cursor-pointer bg-transparent border-none active:text-muted"
        >
          {showManual ? "Hide manual token entry" : "Use a manual API token instead"}
        </button>

        {showManual && (
          <div className="mt-4 pt-4 border-t border-border text-left">
            <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-4">
              manual token
            </h3>

            <ol className="list-none mb-5">
              {[
                <>Go to <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">app.whoop.com</code> in a browser and log in</>,
                <>Open DevTools — <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">F12</code> or <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">Cmd+Option+I</code></>,
                <>Go to the <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">Network</code> tab, then refresh the page</>,
                <>Click any request to <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">api.prod.whoop.com</code></>,
                <>Find the <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">Authorization</code> header</>,
                <>Copy everything after <code className="font-mono text-[11px] bg-accent-buffer/10 text-accent-buffer px-1.5 py-0.5 rounded">Bearer</code> and paste below</>,
              ].map((content, i) => (
                <li key={i} className="text-[13px] text-[#b0adc0] py-2 border-b border-border last:border-b-0 leading-[1.55] flex items-start gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-accent-buffer text-bg text-center text-[11px] font-semibold leading-5 shrink-0 justify-center">
                    {i + 1}
                  </span>
                  <span>{content}</span>
                </li>
              ))}
            </ol>

            {error && <p className="text-red text-xs mb-2.5">{error}</p>}

            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              placeholder="Paste your Whoop token here..."
              className="w-full bg-bg border border-border rounded-lg px-3.5 py-3 text-text font-mono text-xs mb-3.5 outline-none focus:border-accent-buffer transition-colors placeholder:text-dot"
              autoComplete="off"
              spellCheck={false}
            />

            <button
              onClick={handleConnect}
              className="w-full py-3 border-none rounded-[10px] bg-accent-buffer/80 text-bg font-semibold text-[13px] cursor-pointer active:opacity-80 transition-opacity"
            >
              Connect with Token
            </button>
          </div>
        )}
      </div>

      <p className="mt-5 text-[11px] text-dot max-w-[400px] leading-[1.5]">
        Signing in with WHOOP enables automatic recovery detection, push notifications, and cloud-synced schedules.
      </p>
    </div>
  );
}
