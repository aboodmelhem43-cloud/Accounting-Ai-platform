"use client";
import { useEffect } from "react";
import gsap from "gsap";

export function PageAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".gsap-page-header", { y: -20, opacity: 0, duration: 0.45 });
      tl.from(".gsap-page-controls", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2");
      tl.from(".gsap-page-content", { y: 24, opacity: 0, duration: 0.4 }, "-=0.15");
      tl.from(".gsap-page-card", { y: 20, opacity: 0, duration: 0.35, stagger: 0.07 }, "-=0.3");
    });
    return () => ctx.revert();
  }, []);
  return null;
}
