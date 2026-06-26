import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login"],
        disallow: ["/api/", "/dashboard/", "/invoices/", "/journal/", "/reports/", "/admin/"],
      },
    ],
    sitemap: "https://www.mohasabai.com/sitemap.xml",
  };
}
