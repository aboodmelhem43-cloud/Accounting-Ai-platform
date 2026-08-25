"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-8">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-bold text-gray-800">حدث خطأ غير متوقع</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        Something went wrong loading this page. Try refreshing or contact support if the issue persists.
      </p>
      {error.message && (
        <p className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 max-w-sm">
          {error.message}
        </p>
      )}
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
