"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Business {
  id: string;
  name: string;
  country: string;
  baseCurrency: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
  onboardingCompleted: boolean;
  users: { email: string; role: string }[];
  _count: { journalEntries: number; invoices: number };
}

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: "bg-gray-100 text-gray-700",
  STARTER: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  BUSINESS: "bg-green-100 text-green-700",
};

const COUNTRY_NAMES: Record<string, string> = {
  EG: "Egypt", SA: "Saudi Arabia", AE: "UAE", JO: "Jordan",
  KW: "Kuwait", BH: "Bahrain", QA: "Qatar", OM: "Oman",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  // Extend trials state
  const [secret, setSecret] = useState("");
  const [trialResult, setTrialResult] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);

  const fetchBusinesses = useCallback(async (q: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses?search=${encodeURIComponent(q)}&page=${p}`);
      if (res.status === 403) { setIsSuperAdmin(false); return; }
      if (!res.ok) { setError("Failed to load"); return; }
      setIsSuperAdmin(true);
      const data = await res.json();
      setBusinesses(data.businesses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses(search, page);
  }, [fetchBusinesses, search, page]);

  async function extendTrials() {
    if (!secret) return;
    setTrialLoading(true);
    setTrialResult(null);
    try {
      const res = await fetch("/api/admin/extend-trials", {
        method: "POST",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) {
        setTrialResult("Wrong secret or error: " + JSON.stringify(data));
      } else {
        setTrialResult(`Updated ${data.updated} account(s)`);
        fetchBusinesses(search, page);
      }
    } catch {
      setTrialResult("Network error");
    } finally {
      setTrialLoading(false);
    }
  }

  if (isSuperAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500">This page is restricted to super-admins only.</p>
          <p className="text-xs text-gray-400">Add <code>SUPER_ADMIN_EMAILS</code> to Vercel env vars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Logged in as: {session?.user?.email}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total businesses</p>
        </div>
      </div>

      {/* Extend Trials Tool */}
      <div className="card p-4 space-y-3 border border-amber-200 bg-amber-50">
        <h2 className="font-semibold text-amber-800 text-sm">One-time Tool: Extend Trials to 35 Days</h2>
        <div className="flex gap-2">
          <input
            type="password"
            className="input flex-1 text-sm"
            placeholder="ADMIN_SECRET from Vercel env"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <button
            onClick={extendTrials}
            disabled={!secret || trialLoading}
            className="btn-primary text-sm px-4"
          >
            {trialLoading ? "Running..." : "Run"}
          </button>
        </div>
        {trialResult && <p className="text-sm text-amber-700">{trialResult}</p>}
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search by business name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {loading && <span className="text-sm text-gray-400 animate-pulse">Loading...</span>}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Businesses Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Business</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Owner Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Country</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Trial Ends</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Created</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Entries / Invoices</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {businesses.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  {search ? "No results found" : "No businesses yet"}
                </td>
              </tr>
            )}
            {businesses.map((b) => {
              const trialDate = b.trialEndsAt ? new Date(b.trialEndsAt) : null;
              const isExpired = trialDate ? new Date() > trialDate : false;
              const ownerEmail = b.users[0]?.email ?? "—";
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.name}</div>
                    {!b.onboardingCompleted && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">onboarding pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ownerEmail}</td>
                  <td className="px-4 py-3 text-gray-600">{COUNTRY_NAMES[b.country] ?? b.country} ({b.baseCurrency})</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[b.plan] ?? "bg-gray-100 text-gray-700"}`}>
                      {b.plan.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {trialDate ? (
                      <span className={isExpired ? "text-red-600" : "text-green-600"}>
                        {trialDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        {isExpired && " (expired)"}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {b._count.journalEntries} / {b._count.invoices}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary text-sm px-3 py-1.5"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            className="btn-secondary text-sm px-3 py-1.5"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
