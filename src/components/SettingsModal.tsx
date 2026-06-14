"use client";

import { signIn } from "next-auth/react";

interface Props {
  open: boolean;
  isConnected: boolean;
  onRebuild?: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export default function SettingsModal({ open, isConnected, onRebuild, onDisconnect, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-4">
          settings
        </h3>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div>
            <div className="text-[13px] font-medium">WHOOP</div>
            <div className="text-[11px] text-muted">{isConnected ? "Connected" : "Not connected"}</div>
          </div>
          {isConnected ? (
            <button
              onClick={() => signIn("whoop", { callbackUrl: "/" })}
              className="px-3 py-1.5 rounded-lg bg-transparent border border-border text-muted text-xs cursor-pointer"
            >
              Refresh session
            </button>
          ) : (
            <button
              onClick={() => signIn("whoop", { callbackUrl: "/" })}
              className="px-3 py-1.5 rounded-lg bg-accent-buffer text-bg text-xs font-semibold cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>

        {onRebuild && (
          <button
            onClick={onRebuild}
            className="w-full py-2.5 rounded-lg bg-transparent border border-accent-buffer/30 text-accent-buffer text-[13px] cursor-pointer mb-2.5"
          >
            Rebuild Schedule
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-transparent border border-border text-muted text-[13px] cursor-pointer mb-2.5"
        >
          Close
        </button>

        {isConnected && (
          <button
            onClick={onDisconnect}
            className="w-full py-2 rounded-lg bg-transparent border border-red/30 text-red text-xs cursor-pointer"
          >
            Disconnect Whoop
          </button>
        )}
      </div>
    </div>
  );
}
