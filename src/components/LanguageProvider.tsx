"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getT, type Lang, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  toggleLang: () => {},
  t: getT("ar"),
  dir: "rtl",
});

export function LanguageProvider({ children, initialLang = "ar" }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "ar") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
    document.cookie = `lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }, [lang]);

  const toggleLang = useCallback(() => {
    const next = lang === "ar" ? "en" : "ar";
    // Set cookie synchronously before refresh so server components see the new value
    document.cookie = `lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem("lang", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    setLang(next);
    // Re-fetch server components with the updated cookie
    router.refresh();
  }, [lang, router]);

  const t = getT(lang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
