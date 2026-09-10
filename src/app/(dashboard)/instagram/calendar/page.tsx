"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  mediaUrls: string[];
  caption: string | null;
  status: string;
  scheduledAt: string;
}

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  PUBLISHED: "bg-green-500",
  DRAFT:     "bg-gray-400",
  FAILED:    "bg-red-500",
};

export default function CalendarPage() {
  const [year, setYear]   = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // fetch all scheduled/published posts for this month
      const start = new Date(year, month, 1).toISOString();
      const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(
        `/api/instagram/posts?limit=200&scheduledFrom=${encodeURIComponent(start)}&scheduledTo=${encodeURIComponent(end)}`
      );
      if (res.ok) {
        const data = await res.json() as { posts: Post[] };
        setPosts(data.posts.filter((p) => p.scheduledAt));
      }
      setLoading(false);
    };
    void load();
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("ar", { month: "long", year: "numeric" });

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // map day -> posts
  const postsByDay: Record<number, Post[]> = {};
  for (const p of posts) {
    const d = new Date(p.scheduledAt).getDate();
    if (!postsByDay[d]) postsByDay[d] = [];
    postsByDay[d].push(p);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const selectedPosts = selectedDay ? (postsByDay[selectedDay] ?? []) : [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 التقويم</h1>
          <p className="text-gray-500 text-sm mt-1">عرض المنشورات المجدولة</p>
        </div>
        <Link href="/instagram/posts/create" className="btn-primary">
          ✏️ منشور جديد
        </Link>
      </div>

      {/* Month nav */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            →
          </button>
          <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            ←
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
              {d.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">جارٍ التحميل…</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[60px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayPosts = postsByDay[day] ?? [];
              const isToday = isCurrentMonth && today.getDate() === day;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`bg-white min-h-[60px] p-1 text-right flex flex-col transition-colors ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? "bg-blue-600 text-white" : "text-gray-700"
                  }`}>
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className={`w-2 h-2 rounded-full ${STATUS_DOT[p.status] ?? "bg-gray-300"}`}
                        title={p.caption ?? ""}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-xs text-gray-400">+{dayPosts.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day posts */}
      {selectedDay !== null && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            {selectedDay} {monthLabel}
          </h3>
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد منشورات في هذا اليوم</p>
          ) : (
            <div className="space-y-3">
              {selectedPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/instagram/posts/${p.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.mediaUrls[0] ? (
                      <img src={p.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">📷</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.caption ?? "بدون تسمية"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.scheduledAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.status] ?? "bg-gray-300"}`} />
                </Link>
              ))}
            </div>
          )}
          <Link
            href={`/instagram/posts/create`}
            className="block text-center text-sm text-blue-600 hover:underline mt-4"
          >
            + إضافة منشور في هذا اليوم
          </Link>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        {[
          { cls: "bg-blue-500",  label: "مجدول" },
          { cls: "bg-green-500", label: "منشور" },
          { cls: "bg-red-500",   label: "فشل" },
          { cls: "bg-gray-400",  label: "مسودة" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.cls}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
