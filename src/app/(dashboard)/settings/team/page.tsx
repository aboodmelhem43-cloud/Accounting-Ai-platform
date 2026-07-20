"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
  role: "OWNER" | "ACCOUNTANT";
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: "ACCOUNTANT";
  expiresAt: string;
  createdAt: string;
}

interface BookkeeperEntry {
  accessId: string;
  userId: string;
  name: string | null;
  email: string;
  grantedAt: string;
}

interface BookkeeperInvite {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

interface TeamData {
  users: TeamUser[];
  invites: PendingInvite[];
  bookkeepers: BookkeeperEntry[];
  bookkeeperInvites: BookkeeperInvite[];
  maxUsers: number;
  planName: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const isOwner = session?.user?.role === "OWNER";

  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [bkInviteEmail, setBkInviteEmail] = useState("");
  const [bkInviting, setBkInviting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [bkMsg, setBkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [cancelBkId, setCancelBkId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, type: "TEAM" }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ ok: true, text: isAr ? `تم إرسال الدعوة إلى ${inviteEmail}` : `Invitation sent to ${inviteEmail}` });
        setInviteEmail("");
        await fetchTeam();
      } else {
        setMsg({ ok: false, text: d.error ?? (isAr ? "حدث خطأ" : "An error occurred") });
      }
    } catch {
      setMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setInviting(false);
    }
  }

  async function handleBookkeeperInvite(e: React.FormEvent) {
    e.preventDefault();
    setBkMsg(null);
    setBkInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bkInviteEmail, type: "BOOKKEEPER" }),
      });
      const d = await res.json();
      if (res.ok) {
        setBkMsg({ ok: true, text: isAr ? `تم إرسال دعوة المحاسب إلى ${bkInviteEmail}` : `Bookkeeper invitation sent to ${bkInviteEmail}` });
        setBkInviteEmail("");
        await fetchTeam();
      } else {
        setBkMsg({ ok: false, text: d.error ?? (isAr ? "حدث خطأ" : "An error occurred") });
      }
    } catch {
      setBkMsg({ ok: false, text: isAr ? "خطأ في الاتصال" : "Connection error" });
    } finally {
      setBkInviting(false);
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!confirm(isAr ? "هل تريد إزالة هذا المستخدم؟" : "Remove this user from your team?")) return;
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/team/users/${userId}`, { method: "DELETE" });
      if (res.ok) await fetchTeam();
      else {
        const d = await res.json();
        setMsg({ ok: false, text: d.error ?? "Error" });
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setCancelingId(inviteId);
    try {
      const res = await fetch(`/api/team/invites/${inviteId}`, { method: "DELETE" });
      if (res.ok) await fetchTeam();
    } finally {
      setCancelingId(null);
    }
  }

  async function handleRevokeBookkeeper(accessId: string) {
    if (!confirm(isAr ? "هل تريد إلغاء وصول هذا المحاسب؟" : "Revoke this bookkeeper's access?")) return;
    setRevokingId(accessId);
    try {
      const res = await fetch(`/api/team/bookkeepers/${accessId}`, { method: "DELETE" });
      if (res.ok) await fetchTeam();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCancelBkInvite(inviteId: string) {
    setCancelBkId(inviteId);
    try {
      const res = await fetch(`/api/team/invites/${inviteId}`, { method: "DELETE" });
      if (res.ok) await fetchTeam();
    } finally {
      setCancelBkId(null);
    }
  }

  const plan = session?.user?.plan ?? "";
  const canInvite = plan === "PRO" || plan === "BUSINESS";
  const totalSlots = data?.maxUsers ?? 1;
  const usedSlots = (data?.users.length ?? 0) + (data?.invites.length ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "إدارة الفريق" : "Team Management"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAr
            ? `خطتك تتيح ${totalSlots} ${totalSlots === 1 ? "مستخدم" : "مستخدمين"} — مستخدم حالياً: ${usedSlots}`
            : `Your plan allows ${totalSlots} user${totalSlots > 1 ? "s" : ""} — ${usedSlots} used`}
        </p>
      </div>

      {/* Upgrade notice for non-Pro/Business */}
      {!canInvite && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {isAr
            ? "⬆️ ميزة إضافة أعضاء الفريق متاحة لخططَي Pro (3 مستخدمين) وBusiness (10 مستخدمين). قم بترقية خطتك من صفحة الأسعار."
            : "⬆️ Adding team members is available on the Pro plan (3 users) and Business plan (10 users). Upgrade from the Pricing page."}
        </div>
      )}

      {/* Seats progress */}
      {canInvite && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{isAr ? "المقاعد المستخدمة" : "Seats used"}</span>
            <span className="font-medium">{usedSlots} / {totalSlots}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (usedSlots / totalSlots) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Invite form — owner only, on eligible plan */}
      {isOwner && canInvite && usedSlots < totalSlots && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            {isAr ? "دعوة عضو جديد" : "Invite a New Member"}
          </h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              className="input flex-1"
              placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              dir="ltr"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="btn-primary whitespace-nowrap disabled:opacity-60"
            >
              {inviting ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال دعوة" : "Send Invite")}
            </button>
          </form>
          {msg && (
            <p className={`text-sm mt-3 ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {isAr
              ? "سيتم إرسال رابط الدعوة إلى بريدهم الإلكتروني. الدعوة صالحة لمدة 7 أيام."
              : "An invite link will be sent to their email. The invitation is valid for 7 days."}
          </p>
        </div>
      )}

      {/* Current team members */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">
          {isAr ? "أعضاء الفريق" : "Team Members"}
        </h2>
        <div className="space-y-3">
          {data?.users.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{user.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  user.role === "OWNER"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {user.role === "OWNER"
                    ? (isAr ? "المالك" : "Owner")
                    : (isAr ? "محاسب" : "Accountant")}
                </span>
                {isOwner && user.role !== "OWNER" && user.id !== session?.user?.id && (
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    disabled={removingId === user.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {removingId === user.id ? "..." : (isAr ? "إزالة" : "Remove")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending team invitations */}
      {data && data.invites.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            {isAr ? "دعوات معلقة" : "Pending Invitations"}
          </h2>
          <div className="space-y-3">
            {data.invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                  <div className="text-xs text-gray-400">
                    {isAr ? "تنتهي" : "Expires"}{" "}
                    {new Date(invite.expiresAt).toLocaleDateString(isAr ? "ar" : "en-GB")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    {isAr ? "في الانتظار" : "Pending"}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={cancelingId === invite.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancelingId === invite.id ? "..." : (isAr ? "إلغاء" : "Cancel")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── External Bookkeepers Section ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              {isAr ? "المحاسبون الخارجيون" : "External Bookkeepers"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAr
                ? "محاسبون يمكنهم الوصول إلى بياناتك دون الانضمام لفريقك الداخلي"
                : "Accountants who can access your books without joining your internal team"}
            </p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {isAr ? "مثل Xero" : "Xero-style"}
          </span>
        </div>

        {/* Active bookkeepers */}
        {data && data.bookkeepers.length > 0 ? (
          <div className="space-y-3 mb-4">
            {data.bookkeepers.map((bk) => (
              <div key={bk.accessId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                    {(bk.name ?? bk.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{bk.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{bk.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    {isAr ? "محاسب خارجي" : "Bookkeeper"}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleRevokeBookkeeper(bk.accessId)}
                      disabled={revokingId === bk.accessId}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {revokingId === bk.accessId ? "..." : (isAr ? "إلغاء الوصول" : "Revoke")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">
            {isAr ? "لا يوجد محاسبون خارجيون حتى الآن." : "No external bookkeepers yet."}
          </p>
        )}

        {/* Pending bookkeeper invites */}
        {data && data.bookkeeperInvites.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {isAr ? "دعوات معلقة" : "Pending invites"}
            </p>
            {data.bookkeeperInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-800">{inv.email}</div>
                  <div className="text-xs text-gray-400">
                    {isAr ? "تنتهي" : "Expires"}{" "}
                    {new Date(inv.expiresAt).toLocaleDateString(isAr ? "ar" : "en-GB")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {isAr ? "في الانتظار" : "Pending"}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleCancelBkInvite(inv.id)}
                      disabled={cancelBkId === inv.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancelBkId === inv.id ? "..." : (isAr ? "إلغاء" : "Cancel")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite bookkeeper form */}
        {isOwner && (
          <form onSubmit={handleBookkeeperInvite} className="flex gap-3 border-t border-gray-100 pt-4">
            <input
              type="email"
              className="input flex-1"
              placeholder={isAr ? "بريد المحاسب الخارجي" : "Bookkeeper's email"}
              value={bkInviteEmail}
              onChange={(e) => setBkInviteEmail(e.target.value)}
              required
              dir="ltr"
            />
            <button
              type="submit"
              disabled={bkInviting || !bkInviteEmail.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {bkInviting ? (isAr ? "..." : "Sending...") : (isAr ? "دعوة محاسب" : "Invite Bookkeeper")}
            </button>
          </form>
        )}
        {bkMsg && (
          <p className={`text-sm mt-2 ${bkMsg.ok ? "text-green-600" : "text-red-600"}`}>{bkMsg.text}</p>
        )}
        {isOwner && (
          <p className="text-xs text-gray-400 mt-2">
            {isAr
              ? "المحاسب الخارجي يمكنه الوصول إلى بياناتك من حسابه الخاص دون التأثير على مقاعد الفريق."
              : "External bookkeepers access your books from their own account without using a team seat."}
          </p>
        )}
      </div>
    </div>
  );
}
