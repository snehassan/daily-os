"use client";

import { useState } from "react";

interface Props {
  onConnect: (token: string) => void;
  onSkip: () => void;
}

export default function SetupScreen({ onConnect, onSkip }: Props) {
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
        Connect your Whoop to auto-detect recovery, wake time, and day mode. Or skip to use the schedule manually.
      </p>

      <div className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[460px] lg:max-w-[520px] lg:p-8 text-left">
        <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-4">
          connect whoop
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
          className="w-full py-3.5 border-none rounded-[10px] bg-accent-buffer text-bg font-semibold text-sm cursor-pointer active:opacity-80 transition-opacity"
        >
          Connect & Load
        </button>

        <button
          onClick={onSkip}
          className="mt-4 w-full py-3 rounded-[10px] bg-transparent border border-border text-muted text-[13px] cursor-pointer active:border-muted transition-colors"
        >
          Skip — use schedule without Whoop
        </button>
      </div>

      <p className="mt-5 text-[11px] text-dot max-w-[400px] leading-[1.5]">
        Your token is saved only in this browser and is never sent anywhere except Whoop's own API. Tokens expire periodically — you'll be prompted to re-enter when that happens.
      </p>
    </div>
  );
}
