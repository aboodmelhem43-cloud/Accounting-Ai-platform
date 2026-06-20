import { cookies } from "next/headers";
import { getT, type Lang } from "./index";

export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const val = cookieStore.get("lang")?.value;
  return val === "ar" || val === "en" ? val : "ar";
}

export async function getServerT() {
  const lang = await getServerLang();
  return { t: getT(lang), lang };
}
