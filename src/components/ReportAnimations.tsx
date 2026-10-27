"use client";

import { useEffect } from "react";
import gsap from "gsap";

export function ReportAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".gsap-report-header", { y: -20, opacity: 0, duration: 0.45 });
      tl.from(".gsap-report-controls", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2");
    });
    return () => ctx.revert();
  }, []);

  return null;
}
