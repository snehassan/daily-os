"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  currentToken: string;
  onSave: (token: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function SettingsModal({ open, currentToken, onSave, onClear, onClose }: Props) {
  const [token, setToken] = useState(currentToken);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface border border-border rounded-[14px] p-6 w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent-buffer mb-4">
          whoop token
        </h3>

        <label className="text-xs text-muted block mb-1.5">Personal access token</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste token..."
          className="w-full bg-bg border border-border rounded-lg px-3.5 py-3 text-text font-mono text-xs mb-4 outline-none focus:border-accent-buffer placeholder:text-dot"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-transparent border border-border text-muted text-[13px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(token.trim())}
            className="flex-1 py-2.5 rounded-lg bg-accent-buffer text-bg font-semibold text-[13px] cursor-pointer"
          >
            Save & Reload
          </button>
        </div>

        <button
          onClick={onClear}
          className="mt-2.5 w-full py-2 rounded-lg bg-transparent border border-red/30 text-red text-xs cursor-pointer"
        >
          Disconnect Whoop
        </button>
      </div>
    </div>
  );
}
