"use client";
import { useEffect } from "react";
import gsap from "gsap";

export function JournalAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".gsap-journal-header", { y: -20, opacity: 0, duration: 0.45 });
      tl.from(".gsap-journal-filters", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2");
      tl.from(".gsap-journal-card", { y: 24, opacity: 0, duration: 0.4, stagger: 0.08 }, "-=0.15");
    });
    return () => ctx.revert();
  }, []);
  return null;
}
