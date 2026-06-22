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

interface CountryStat { country: string; _count: { id: number } }

interface PlanBreakdown { plan: string; count: number; price: number }
interface MonthlySignup { month: string; count: number }
interface AdminStats {
  totalBusinesses: number;
  newLast7d: number;
  newLast30d: number;
  totalInvoices: number;
  totalEntries: number;
  mrr: number;
  trialActive: number;
  planBreakdown: PlanBreakdown[];
  monthlySignups: MonthlySignup[];
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

const COUNTRY_FLAGS: Record<string, string> = {
  EG: "🇪🇬", SA: "🇸🇦", AE: "🇦🇪", JO: "🇯🇴",
  KW: "🇰🇼", BH: "🇧🇭", QA: "🇶🇦", OM: "🇴🇲",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  // Extend trials state
  const [secret, setSecret] = useState("");
  const [trialResult, setTrialResult] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // AI test state
  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{ ok: boolean; keyPreview?: string; error?: string; errorType?: string; response?: string; step?: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ } finally {
      setStatsLoading(false);
    }
  }, []);

  async function testAi() {
    setAiTesting(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/admin/test-ai", { method: "POST" });
      const data = await res.json();
      setAiResult(data);
    } catch {
      setAiResult({ ok: false, error: "Network error" });
    } finally {
      setAiTesting(false);
    }
  }

  const fetchBusinesses = useCallback(async (q: string, c: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ search: q, page: String(p) });
      if (c) params.set("country", c);
      const res = await fetch(`/api/admin/businesses?${params}`);
      if (res.status === 403) { setIsSuperAdmin(false); return; }
      if (!res.ok) { setError("Failed to load"); return; }
      setIsSuperAdmin(true);
      const data = await res.json();
      setBusinesses(data.businesses);
      setTotal(data.total);
      setPages(data.pages);
      if (p === 1 && !c) setCountryStats(data.countryStats ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses(search, countryFilter, page);
  }, [fetchBusinesses, search, countryFilter, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
        fetchBusinesses(search, countryFilter, page);
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
          <p className="text-sm text-gray-500 mt-0.5">{session?.user?.email}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">{countryFilter ? `businesses in ${COUNTRY_NAMES[countryFilter] ?? countryFilter}` : "total businesses"}</p>
        </div>
      </div>

      {/* Platform Analytics */}
      <div className="space-y-4">
        {/* Overview stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Businesses", value: stats?.totalBusinesses ?? "—", sub: `+${stats?.newLast7d ?? 0} this week` },
            { label: "New (30 days)", value: stats?.newLast30d ?? "—", sub: "new signups" },
            { label: "Est. MRR", value: stats ? `$${stats.mrr.toLocaleString()}` : "—", sub: "paid plans only" },
            { label: "Active Trials", value: stats?.trialActive ?? "—", sub: "free trial users" },
          ].map((card) => (
            <div key={card.label} className="card p-4 space-y-1">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{statsLoading ? <span className="animate-pulse text-gray-300">—</span> : card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan breakdown */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Subscriptions by Plan</h3>
            {statsLoading && <div className="h-24 animate-pulse bg-gray-100 rounded" />}
            {stats && (
              <div className="space-y-2">
                {[
                  { plan: "FREE_TRIAL", label: "Free Trial", color: "bg-gray-400" },
                  { plan: "STARTER", label: "Starter ($69)", color: "bg-blue-500" },
                  { plan: "PRO", label: "Pro ($149)", color: "bg-purple-500" },
                  { plan: "BUSINESS", label: "Business ($199)", color: "bg-green-500" },
                ].map(({ plan, label, color }) => {
                  const entry = stats.planBreakdown.find((p) => p.plan === plan);
                  const count = entry?.count ?? 0;
                  const max = Math.max(...stats.planBreakdown.map((p) => p.count), 1);
                  return (
                    <div key={plan} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly growth chart */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Monthly Signups (6 months)</h3>
            {statsLoading && <div className="h-24 animate-pulse bg-gray-100 rounded" />}
            {stats && (
              <div className="flex items-end gap-2 h-24">
                {stats.monthlySignups.map(({ month, count }) => {
                  const max = Math.max(...stats.monthlySignups.map((m) => m.count), 1);
                  const pct = Math.max((count / max) * 100, 4);
                  return (
                    <div key={month} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-medium text-gray-600">{count || ""}</span>
                      <div className="w-full bg-blue-500 rounded-t" style={{ height: `${pct}%` }} />
                      <span className="text-xs text-gray-400 leading-none">{month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Total Invoices Created</p>
            <p className="text-xl font-bold text-gray-900">{stats?.totalInvoices.toLocaleString() ?? "—"}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Total Journal Entries</p>
            <p className="text-xl font-bold text-gray-900">{stats?.totalEntries.toLocaleString() ?? "—"}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Website visitor analytics are available in the{" "}
          <span className="font-medium">Vercel Dashboard → Analytics</span> tab.
        </p>
      </div>

      {/* Country stats */}
      {countryStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCountryFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !countryFilter ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            All countries
          </button>
          {countryStats.map((s) => (
            <button
              key={s.country}
              onClick={() => { setCountryFilter(s.country); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                countryFilter === s.country ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {COUNTRY_FLAGS[s.country] ?? ""} {COUNTRY_NAMES[s.country] ?? s.country} ({s._count.id})
            </button>
          ))}
        </div>
      )}

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

      {/* AI Diagnostics */}
      <div className="card p-4 space-y-3 border border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-blue-800 text-sm">AI Assistant Diagnostics</h2>
          <button
            onClick={testAi}
            disabled={aiTesting}
            className="btn-primary text-sm px-4 py-1.5"
          >
            {aiTesting ? "Testing..." : "Test AI Connection"}
          </button>
        </div>
        {aiResult && (
          <div className={`rounded-lg p-3 text-sm font-mono ${aiResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            <div><span className="font-bold">Status:</span> {aiResult.ok ? "✅ Working" : "❌ Failed"}</div>
            {aiResult.keyPreview && <div><span className="font-bold">API Key:</span> {aiResult.keyPreview}</div>}
            {aiResult.step && <div><span className="font-bold">Failed at:</span> {aiResult.step}</div>}
            {aiResult.errorType && <div><span className="font-bold">Error type:</span> {aiResult.errorType}</div>}
            {aiResult.error && <div><span className="font-bold">Error:</span> {aiResult.error}</div>}
            {aiResult.response && <div><span className="font-bold">Response:</span> {aiResult.response}</div>}
          </div>
        )}
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
                  {search || countryFilter ? "No results found" : "No businesses yet"}
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
                  <td className="px-4 py-3 text-gray-600">
                    {COUNTRY_FLAGS[b.country] ?? ""} {COUNTRY_NAMES[b.country] ?? b.country} ({b.baseCurrency})
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[b.plan] ?? "bg-gray-100 text-gray-700"}`}>
                      {b.plan.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
