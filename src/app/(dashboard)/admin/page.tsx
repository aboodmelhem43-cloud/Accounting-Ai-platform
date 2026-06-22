"use client";
import { useState } from "react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function extendTrials() {
    if (!secret) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/extend-trials", {
        method: "POST",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) {
        setResult("❌ Wrong secret or error: " + JSON.stringify(data));
      } else {
        setResult(`✅ Updated ${data.updated} account(s):\n${data.businesses.join("\n") || "None needed updating"}`);
      }
    } catch {
      setResult("❌ Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Extend Trials to 35 Days</h2>
        <p className="text-sm text-gray-500">
          Fixes existing accounts that were created with the old 10-day trial.
        </p>
        <input
          type="password"
          className="input"
          placeholder="Enter ADMIN_SECRET from Vercel"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          onClick={extendTrials}
          disabled={!secret || loading}
          className="btn-primary w-full"
        >
          {loading ? "Running..." : "Extend All Trials"}
        </button>
        {result && (
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-800">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
