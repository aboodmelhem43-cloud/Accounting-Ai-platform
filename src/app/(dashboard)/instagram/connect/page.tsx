"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Profile {
  id:             string;
  instagramId:    string;
  username:       string;
  profilePicUrl:  string | null;
  followersCount: number;
  tokenExpiresAt: string | null;
  createdAt:      string;
}

const ERROR_MESSAGES: Record<string, string> = {
  denied:         "تم رفض الإذن من Facebook. يرجى المحاولة مجدداً.",
  state:          "رابط غير صالح. يرجى البدء من جديد.",
  no_pages:       "لم يتم العثور على صفحات Facebook مرتبطة بحسابك. يجب أن يكون لديك صفحة Facebook مرتبطة بحساب Instagram Business.",
  no_ig_account:  "لم يتم العثور على حساب Instagram Business مرتبط بصفحاتك. تأكد من تحويل حسابك إلى نوع Business أو Creator.",
  token_exchange: "فشل في الاتصال بـ Facebook. حاول مجدداً.",
  unknown:        "حدث خطأ غير متوقع. حاول مجدداً.",
};

export default function InstagramConnectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [loading, setLoading]     = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const error   = searchParams.get("error");
  const success  = searchParams.get("success");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/instagram/profile");
      if (res.ok) {
        const { profile: p } = await res.json() as { profile: Profile | null };
        setProfile(p);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/instagram/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("فصل حساب إنستغرام؟ المنشورات الموجودة لن تتأثر.")) return;
    setDisconnecting(true);
    await fetch("/api/instagram/disconnect", { method: "DELETE" });
    setProfile(null);
    setDisconnecting(false);
    router.replace("/instagram/connect");
  };

  const tokenExpiresSoon = profile?.tokenExpiresAt
    ? new Date(profile.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="max-w-xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔗 ربط إنستغرام</h1>
        <p className="text-gray-500 text-sm mt-1">اربط حساب Instagram Business للنشر المباشر</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          ❌ {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          ✅ تم ربط حساب إنستغرام بنجاح!
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse h-32" />
      ) : profile ? (
        /* Connected state */
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            {profile.profilePicUrl ? (
              <img
                src={profile.profilePicUrl}
                alt={profile.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">@{profile.username}</p>
              <p className="text-sm text-gray-500">
                {profile.followersCount.toLocaleString("ar")} متابع
              </p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                متصل
              </span>
            </div>
          </div>

          {tokenExpiresSoon && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded-lg">
              ⚠️ صلاحية رمز الوصول تنتهي قريباً. أعد الربط للحفاظ على الاتصال.
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <p>معرّف الحساب: <span className="font-mono">{profile.instagramId}</span></p>
            <p>تاريخ الربط: {new Date(profile.createdAt).toLocaleDateString("ar")}</p>
            {profile.tokenExpiresAt && (
              <p>انتهاء الصلاحية: {new Date(profile.tokenExpiresAt).toLocaleDateString("ar")}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConnect}
              className="flex-1 py-2.5 border border-blue-300 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              🔄 إعادة الربط / تحديث الصلاحية
            </button>
            <button
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
              className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {disconnecting ? "جارٍ…" : "فصل"}
            </button>
          </div>
        </div>
      ) : (
        /* Not connected state */
        <div className="card text-center space-y-6 py-8">
          <div className="text-6xl">📱</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ربط حساب Instagram Business</h2>
            <p className="text-sm text-gray-500">
              انشر مباشرة من المنصة دون نسخ ولصق يدوي
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="text-xl">f</span>
            ربط عبر Facebook
          </button>
          <p className="text-xs text-gray-400">
            ستُعاد توجيهك إلى Facebook لمنح الإذن. نحتاج:<br/>
            قراءة ملفك الشخصي، نشر المحتوى، الوصول لصفحاتك.
          </p>
        </div>
      )}

      {/* Requirements */}
      <div className="card bg-blue-50 border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 المتطلبات</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {[
            "حساب Instagram من نوع Business أو Creator",
            "صفحة Facebook مرتبطة بالحساب",
            "أنت مسؤول الصفحة أو لديك صلاحية التعديل",
            "الصور يجب أن تكون عامة ومستضافة على HTTPS",
          ].map((req) => (
            <li key={req} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span>
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Setup guide */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">⚙️ إعداد المسؤول (مرة واحدة)</h3>
        <p className="text-xs text-gray-500 mb-3">
          يحتاج المسؤول إلى إضافة متغيرات البيئة التالية في Vercel:
        </p>
        <div className="space-y-1.5 font-mono text-xs bg-gray-50 rounded-lg p-3">
          {[
            "FACEBOOK_APP_ID",
            "FACEBOOK_APP_SECRET",
            "INSTAGRAM_REDIRECT_URI",
            "CRON_SECRET",
          ].map((v) => (
            <div key={v} className="text-gray-700">{v}</div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          أنشئ تطبيق Meta من{" "}
          <span className="underline">developers.facebook.com</span>{" "}
          وفعّل Instagram Graph API.
        </p>
      </div>
    </div>
  );
}
