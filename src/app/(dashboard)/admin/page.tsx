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
interface SignupData { label: string; count: number; revenue: number }

interface AdminStats {
  totalBusinesses: number;
  newLast7d: number;
  newLast30d: number;
  newLast365d: number;
  totalInvoices: number;
  totalEntries: number;
  mrr: number;
  trialActive: number;
  paidSubscribers: number;
  newPaidLast7d: number;
  newPaidLast30d: number;
  newPaidLast365d: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  activityLast7d: number;
  activityLast30d: number;
  activityLast365d: number;
  planBreakdown: PlanBreakdown[];
  weeklySignups: SignupData[];
  monthlySignups: SignupData[];
  yearlySignups: SignupData[];
}

type Period = "week" | "month" | "year";

const PLAN_META: Record<string, { label: string; badge: string; bar: string }> = {
  FREE_TRIAL: { label: "Free Trial",       badge: "bg-gray-100 text-gray-600",     bar: "#9CA3AF" },
  STARTER:    { label: "Starter ($69)",    badge: "bg-blue-100 text-blue-700",     bar: "#3B82F6" },
  PRO:        { label: "Pro ($149)",       badge: "bg-violet-100 text-violet-700", bar: "#8B5CF6" },
  BUSINESS:   { label: "Business ($199)", badge: "bg-emerald-100 text-emerald-700", bar: "#10B981" },
};

const COUNTRY_NAMES: Record<string, string> = {
  EG: "Egypt", SA: "Saudi Arabia", AE: "UAE", JO: "Jordan",
  KW: "Kuwait", BH: "Bahrain", QA: "Qatar", OM: "Oman",
};

const COUNTRY_FLAGS: Record<string, string> = {
  EG: "🇪🇬", SA: "🇸🇦", AE: "🇦🇪", JO: "🇯🇴",
  KW: "🇰🇼", BH: "🇧🇭", QA: "🇶🇦", OM: "🇴🇲",
};

/* ── Bar chart ─────────────────────────────────────────────── */
function BarChart({
  data,
  color,
  formatValue,
}: {
  data: { label: string; value: number }[];
  color: string;
  formatValue?: (v: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div className="relative">
      {/* Tooltip */}
      {hovered !== null && data[hovered] && (
        <div
          className="absolute -top-9 z-10 px-2.5 py-1 text-xs font-medium rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${(hovered / data.length) * 100 + 100 / data.length / 2}%`,
            transform: "translateX(-50%)",
            background: "#0D2244",
            color: "#fff",
          }}
        >
          {data[hovered].label}: {fmt(data[hovered].value)}
        </div>
      )}

      {/* Grid lines (3 horizontal) */}
      <div className="absolute inset-x-0 top-0 bottom-6 pointer-events-none flex flex-col justify-between">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-full border-t border-gray-100" />
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1 h-32 relative">
        {data.map(({ label, value }, i) => {
          const pct = Math.max((value / max) * 100, value > 0 ? 4 : 0);
          const isHov = hovered === i;
          return (
            <div
              key={label}
              className="flex-1 flex flex-col items-center h-full min-w-0 cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex-1 w-full flex items-end pb-1">
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: color,
                    opacity: hovered === null || isHov ? 1 : 0.45,
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center leading-none mt-0.5">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── KPI card ──────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  dark,
  loading,
}: {
  label: string;
  value: string | number | null;
  sub?: string;
  delta?: number | null;
  deltaLabel?: string;
  dark?: boolean;
  loading?: boolean;
}) {
  const base = dark
    ? "bg-[#0D2244] border-[#0D2244] text-white"
    : "bg-white border-gray-100 text-gray-900";
  const sub_ = dark ? "text-white/50" : "text-gray-400";
  const val_ = dark ? "text-white" : "text-gray-900";
  const lbl_ = dark ? "text-white/60" : "text-gray-400";

  return (
    <div className={`rounded-2xl border shadow-sm p-5 space-y-2 ${base}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${lbl_}`}>{label}</p>
      <p className={`text-3xl font-bold leading-none ${loading ? "animate-pulse opacity-30" : val_}`}>
        {loading ? "———" : (value ?? "—")}
      </p>
      {sub && <p className={`text-xs ${sub_}`}>{sub}</p>}
      {delta !== undefined && delta !== null && (
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            dark
              ? delta >= 0 ? "bg-white/15 text-white" : "bg-red-500/20 text-red-200"
              : delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)} {deltaLabel}
        </span>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function AdminPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>("month");

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

  const [toolsOpen, setToolsOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [trialResult, setTrialResult] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    ok: boolean; keyPreview?: string; error?: string; errorType?: string; response?: string; step?: string;
  } | null>(null);

  const [lsTesting, setLsTesting] = useState(false);
  const [lsResult, setLsResult] = useState<{
    ok: boolean; keyPreview?: string; storeId?: string; variants?: Record<string, string>; webhookSecret?: string; step?: string; error?: string;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ } finally {
      setStatsLoading(false);
    }
  }, []);

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

  useEffect(() => { fetchBusinesses(search, countryFilter, page); }, [fetchBusinesses, search, countryFilter, page]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function testAi() {
    setAiTesting(true); setAiResult(null);
    try {
      setAiResult(await (await fetch("/api/admin/test-ai", { method: "POST" })).json());
    } catch { setAiResult({ ok: false, error: "Network error" }); } finally { setAiTesting(false); }
  }

  async function testLs() {
    setLsTesting(true); setLsResult(null);
    try {
      setLsResult(await (await fetch("/api/admin/test-lemonsqueezy", { method: "POST" })).json());
    } catch { setLsResult({ ok: false, error: "Network error" }); } finally { setLsTesting(false); }
  }

  async function extendTrials() {
    if (!secret) return;
    setTrialLoading(true); setTrialResult(null);
    try {
      const res = await fetch("/api/admin/extend-trials", { method: "POST", headers: { "x-admin-secret": secret } });
      const data = await res.json();
      setTrialResult(res.ok ? `Updated ${data.updated} account(s)` : "Wrong secret: " + JSON.stringify(data));
      if (res.ok) fetchBusinesses(search, countryFilter, page);
    } catch { setTrialResult("Network error"); } finally { setTrialLoading(false); }
  }

  /* Derived period values */
  const revenue  = stats ? (period === "week" ? stats.revenueWeek : period === "month" ? stats.revenueMonth : stats.revenueYear) : null;
  const newTotal = stats ? (period === "week" ? stats.newLast7d  : period === "month" ? stats.newLast30d  : stats.newLast365d)  : null;
  const newPaid  = stats ? (period === "week" ? stats.newPaidLast7d : period === "month" ? stats.newPaidLast30d : stats.newPaidLast365d) : null;
  const activity = stats ? (period === "week" ? stats.activityLast7d : period === "month" ? stats.activityLast30d : stats.activityLast365d) : null;
  const chartData: SignupData[] = stats
    ? (period === "week" ? stats.weeklySignups : period === "month" ? stats.monthlySignups : stats.yearlySignups)
    : [];

  const revenueLabel = { week: "estimated this week", month: "monthly recurring (MRR)", year: "annual run-rate (ARR)" }[period];
  const periodLabel  = { week: "this week", month: "this month", year: "this year" }[period];

  if (isSuperAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500">This page is restricted to super-admins only.</p>
          <p className="text-xs text-gray-400">Add <code>SUPER_ADMIN_EMAILS</code> to your env vars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{session?.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {(["week", "month", "year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? "bg-[#0D2244] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
          >
            <span className={statsLoading ? "inline-block animate-spin" : "inline-block"}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Businesses"
          value={stats?.totalBusinesses ?? null}
          sub={`${total} in current filter`}
          delta={newTotal}
          deltaLabel={periodLabel}
          loading={statsLoading}
        />
        <KpiCard
          label="Paid Subscribers"
          value={stats?.paidSubscribers ?? null}
          sub="active paying accounts"
          delta={newPaid}
          deltaLabel={periodLabel}
          loading={statsLoading}
        />
        <KpiCard
          label="Revenue Collected"
          value={revenue !== null ? `$${revenue.toLocaleString()}` : null}
          sub={revenueLabel}
          dark
          loading={statsLoading}
        />
        <KpiCard
          label="Active Trials"
          value={stats?.trialActive ?? null}
          sub="35-day free trials"
          delta={stats?.trialActive !== undefined ? null : null}
          loading={statsLoading}
        />
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signups bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">New Signups</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {period === "week" ? "Last 8 weeks" : period === "month" ? "Last 6 months" : "Last 3 years"}
              </p>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {statsLoading ? "—" : (newTotal?.toLocaleString() ?? "—")}
            </span>
          </div>
          {statsLoading
            ? <div className="h-32 animate-pulse bg-gray-100 rounded-xl" />
            : <BarChart data={chartData.map((d) => ({ label: d.label, value: d.count }))} color="#0D2244" />
          }
        </div>

        {/* Revenue bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Revenue from New Signups</h3>
              <p className="text-xs text-gray-400 mt-0.5">Subscription value at sign-up</p>
            </div>
            <span className="text-lg font-bold text-[#00A89D]">
              {statsLoading ? "—" : `$${chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}`}
            </span>
          </div>
          {statsLoading
            ? <div className="h-32 animate-pulse bg-gray-100 rounded-xl" />
            : <BarChart
                data={chartData.map((d) => ({ label: d.label, value: d.revenue }))}
                color="#00A89D"
                formatValue={(v) => `$${v.toLocaleString()}`}
              />
          }
        </div>
      </div>

      {/* ── Plan breakdown + Platform activity ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Subscriptions by Plan</h3>
          {statsLoading
            ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 animate-pulse bg-gray-100 rounded-lg" />)}</div>
            : stats && (
              <div className="space-y-4">
                {(["FREE_TRIAL", "STARTER", "PRO", "BUSINESS"] as const).map((plan) => {
                  const entry = stats.planBreakdown.find((p) => p.plan === plan);
                  const count = entry?.count ?? 0;
                  const pct = stats.totalBusinesses > 0 ? Math.round((count / stats.totalBusinesses) * 100) : 0;
                  const meta = PLAN_META[plan];
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                        <span className="text-xs text-gray-500">{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.bar }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 pt-1">
                  MRR: <span className="font-semibold text-gray-700">${stats.mrr.toLocaleString()}</span>
                  &ensp;·&ensp; ARR: <span className="font-semibold text-gray-700">${(stats.mrr * 12).toLocaleString()}</span>
                </p>
              </div>
            )
          }
        </div>

        {/* Platform activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Platform Activity</h3>
          <div className="space-y-1 divide-y divide-gray-50">
            {[
              { label: "Total invoices created",   value: stats?.totalInvoices.toLocaleString() },
              { label: "Total journal entries",    value: stats?.totalEntries.toLocaleString() },
              { label: `Actions ${periodLabel}`,   value: activity?.toLocaleString(), accent: true },
              { label: "Avg. entries / business",  value: stats && stats.totalBusinesses > 0 ? Math.round(stats.totalEntries / stats.totalBusinesses).toLocaleString() : "—" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${accent ? "text-[#00A89D]" : "text-gray-900"}`}>
                  {statsLoading ? <span className="text-gray-200">—</span> : (value ?? "—")}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-600">Page views</span>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Vercel Analytics →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Country filter ───────────────────────────────────── */}
      {countryStats.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Filter by country</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCountryFilter(""); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !countryFilter ? "bg-[#0D2244] text-white border-[#0D2244]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              All countries
            </button>
            {countryStats.map((s) => (
              <button
                key={s.country}
                onClick={() => { setCountryFilter(s.country); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  countryFilter === s.country ? "bg-[#0D2244] text-white border-[#0D2244]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {COUNTRY_FLAGS[s.country] ?? ""} {COUNTRY_NAMES[s.country] ?? s.country} ({s._count.id})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Businesses table ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">All Businesses</h2>
            <p className="text-xs text-gray-400">
              {loading ? "Loading…" : `${total} ${countryFilter ? `in ${COUNTRY_NAMES[countryFilter] ?? countryFilter}` : "total"}`}
            </p>
          </div>
          <input
            type="text"
            className="input text-sm w-64"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trial ends</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entries / Inv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {search || countryFilter ? "No results found" : "No businesses yet"}
                  </td>
                </tr>
              )}
              {businesses.map((b) => {
                const trialDate = b.trialEndsAt ? new Date(b.trialEndsAt) : null;
                const isExpired = trialDate ? new Date() > trialDate : false;
                const meta = PLAN_META[b.plan];
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.name}</div>
                      {!b.onboardingCompleted && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                          onboarding pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.users[0]?.email ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {COUNTRY_FLAGS[b.country] ?? ""} {COUNTRY_NAMES[b.country] ?? b.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.badge ?? "bg-gray-100 text-gray-600"}`}>
                        {b.plan.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {trialDate ? (
                        <span className={`text-xs ${isExpired ? "text-red-500" : "text-emerald-600"}`}>
                          {trialDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {isExpired && " · expired"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 font-medium">
                      {b._count.journalEntries} / {b._count.invoices}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button className="btn-secondary text-sm px-3 py-1.5" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <button className="btn-secondary text-sm px-3 py-1.5" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Tools & Diagnostics (collapsible) ───────────────── */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setToolsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Tools & Diagnostics</span>
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">admin only</span>
          </div>
          <span className="text-gray-400 text-xs">{toolsOpen ? "▲ hide" : "▼ show"}</span>
        </button>

        {toolsOpen && (
          <div className="p-5 space-y-4 bg-white border-t border-gray-100">
            {/* Extend trials */}
            <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 space-y-3">
              <h2 className="text-sm font-semibold text-amber-800">Extend Trials to 35 Days</h2>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="input flex-1 text-sm"
                  placeholder="ADMIN_SECRET from env"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <button onClick={extendTrials} disabled={!secret || trialLoading} className="btn-primary text-sm px-4">
                  {trialLoading ? "Running…" : "Run"}
                </button>
              </div>
              {trialResult && <p className="text-sm text-amber-700">{trialResult}</p>}
            </div>

            {/* AI diagnostics */}
            <div className="rounded-xl p-4 border border-blue-200 bg-blue-50 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-blue-800">AI Assistant</h2>
                <button onClick={testAi} disabled={aiTesting} className="btn-primary text-sm px-3 py-1.5">
                  {aiTesting ? "Testing…" : "Test Connection"}
                </button>
              </div>
              {aiResult && (
                <div className={`rounded-lg p-3 text-xs font-mono ${aiResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  <div><b>Status:</b> {aiResult.ok ? "✅ Working" : "❌ Failed"}</div>
                  {aiResult.keyPreview && <div><b>Key:</b> {aiResult.keyPreview}</div>}
                  {aiResult.step && <div><b>Failed at:</b> {aiResult.step}</div>}
                  {aiResult.error && <div><b>Error:</b> {aiResult.error}</div>}
                  {aiResult.response && <div><b>Response:</b> {aiResult.response}</div>}
                </div>
              )}
            </div>

            {/* Lemon Squeezy diagnostics */}
            <div className="rounded-xl p-4 border border-yellow-200 bg-yellow-50 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-yellow-800">Payment Gateway (Lemon Squeezy)</h2>
                <button onClick={testLs} disabled={lsTesting} className="btn-primary text-sm px-3 py-1.5">
                  {lsTesting ? "Testing…" : "Test Connection"}
                </button>
              </div>
              {lsResult && (
                <div className={`rounded-lg p-3 text-xs font-mono ${lsResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  <div><b>Status:</b> {lsResult.ok ? "✅ Connected" : "❌ Failed"}</div>
                  {lsResult.keyPreview && <div><b>Key:</b> {lsResult.keyPreview}</div>}
                  {lsResult.storeId && <div><b>Store ID:</b> {lsResult.storeId}</div>}
                  {lsResult.step && <div><b>Failed at:</b> {lsResult.step}</div>}
                  {lsResult.error && <div><b>Error:</b> {lsResult.error}</div>}
                  {lsResult.variants && (
                    <div className="mt-1 space-y-0.5">
                      <div><b>Variants:</b></div>
                      {Object.entries(lsResult.variants).map(([plan, id]) => (
                        <div key={plan} className="ml-2">
                          {plan}: <span className={id === "NOT SET" ? "text-red-600" : ""}>{id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {lsResult.webhookSecret && <div><b>Webhook:</b> {lsResult.webhookSecret}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
