"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function UpgradedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      setShow(true);
      // Remove query param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
      setTimeout(() => setShow(false), 6000);
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2">
      <span className="text-lg">🎉</span>
      <div>
        <div>تم ترقية اشتراكك بنجاح!</div>
        <div className="text-green-200 text-xs font-normal">Your subscription has been upgraded.</div>
      </div>
      <button onClick={() => setShow(false)} className="ml-2 text-green-200 hover:text-white">✕</button>
    </div>
  );
}
