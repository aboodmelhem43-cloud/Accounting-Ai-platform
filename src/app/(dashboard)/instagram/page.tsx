import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InstagramDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { businessId } = session.user;

  const [total, drafts, scheduled, published, igProfile] = await Promise.all([
    prisma.instagramPost.count({ where: { businessId } }),
    prisma.instagramPost.count({ where: { businessId, status: "DRAFT" } }),
    prisma.instagramPost.count({ where: { businessId, status: "SCHEDULED" } }),
    prisma.instagramPost.count({ where: { businessId, status: "PUBLISHED" } }),
    prisma.instagramProfile.findUnique({
      where: { businessId },
      select: { username: true, profilePicUrl: true, followersCount: true, tokenExpiresAt: true },
    }),
  ]);

  // Next 3 scheduled posts
  const upcomingPosts = await prisma.instagramPost.findMany({
    where: { businessId, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  // 4 most recent posts
  const recentPosts = await prisma.instagramPost.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const statusMap: Record<string, { label: string; cls: string }> = {
    DRAFT:     { label: "مسودة",   cls: "bg-gray-100 text-gray-600" },
    SCHEDULED: { label: "مجدول",   cls: "bg-blue-100 text-blue-700" },
    PUBLISHED: { label: "منشور",   cls: "bg-green-100 text-green-700" },
    FAILED:    { label: "فشل",     cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📸 إنستغرام</h1>
          <p className="text-gray-500 text-sm mt-1">خطط لمحتواك وأدِر منشوراتك</p>
        </div>
        <Link href="/instagram/posts/create" className="btn-primary">
          ✏️ منشور جديد
        </Link>
      </div>

      {/* Connection status banner */}
      {igProfile ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          {igProfile.profilePicUrl ? (
            <img src={igProfile.profilePicUrl} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">@{igProfile.username}</p>
            <p className="text-xs text-green-600">{igProfile.followersCount.toLocaleString("ar")} متابع · متصل</p>
          </div>
          <Link href="/instagram/connect" className="text-xs text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100">
            إدارة الربط
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <span className="text-2xl">📵</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">لم يتم ربط حساب إنستغرام</p>
            <p className="text-xs text-yellow-600">اربط حسابك للنشر المباشر</p>
          </div>
          <Link href="/instagram/connect" className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700">
            ربط الآن
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المنشورات", value: total, icon: "📋" },
          { label: "مسودات", value: drafts, icon: "📝" },
          { label: "مجدولة", value: scheduled, icon: "🗓" },
          { label: "منشورة", value: published, icon: "✅" },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Upcoming scheduled */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">📅 المنشورات القادمة</h2>
          {upcomingPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد منشورات مجدولة</p>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((p) => (
                <Link key={p.id} href={`/instagram/posts/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {p.mediaUrls[0] ? (
                    <img src={p.mediaUrls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">📷</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.caption ?? "بدون تسمية"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/instagram/calendar" className="block text-center text-sm text-blue-600 hover:underline mt-4">
            عرض التقويم الكامل
          </Link>
        </div>

        {/* Quick nav */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🔗 روابط سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/instagram/posts/create", icon: "✏️", label: "إنشاء منشور" },
              { href: "/instagram/posts",       icon: "📋", label: "جميع المنشورات" },
              { href: "/instagram/calendar",    icon: "📅", label: "التقويم" },
              { href: "/instagram/settings",    icon: "🏷", label: "مجموعات الهاشتاقات" },
              { href: "/instagram/connect",     icon: "🔗", label: "ربط الحساب" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors text-center"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">🕒 آخر المنشورات</h2>
            <Link href="/instagram/posts" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentPosts.map((p) => {
              const s = statusMap[p.status];
              return (
                <Link key={p.id} href={`/instagram/posts/${p.id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
                    {p.mediaUrls[0] ? (
                      <img src={p.mediaUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📷</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{p.caption ?? "بدون تسمية"}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
