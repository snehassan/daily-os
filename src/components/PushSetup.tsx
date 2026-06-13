"use client";

import { useState, useEffect } from "react";

interface Props {
  vapidPublicKey: string;
  isAuthenticated: boolean;
}

export default function PushSetup({ vapidPublicKey, isAuthenticated }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  if (!isAuthenticated || !vapidPublicKey) return null;
  if (typeof Notification === "undefined") return null;
  if (permission === "denied") return null;
  if (subscribed) return null;

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
      setPermission(Notification.permission);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0d1f3d] border border-[#1a3d6b] rounded-[10px] p-[14px_16px] text-[13px] text-accent-flex leading-[1.6] mb-4 flex items-start gap-2.5">
      <span className="text-lg shrink-0">🔔</span>
      <div className="flex-1">
        <strong className="block font-mono text-[10px] tracking-[0.1em] uppercase mb-1">
          enable notifications
        </strong>
        <span>Get notified the moment your Whoop processes your recovery each morning.</span>
        <button
          onClick={subscribe}
          disabled={loading}
          className="mt-2 block px-4 py-2 bg-accent-flex text-bg text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? "Setting up..." : "Enable Push Notifications"}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
