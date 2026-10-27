"use client";
import { useEffect } from "react";
import gsap from "gsap";

export function ContactsAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".gsap-contacts-header", { y: -20, opacity: 0, duration: 0.45 });
      tl.from(".gsap-contacts-tabs", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2");
      tl.from(".gsap-contacts-table", { y: 24, opacity: 0, duration: 0.4 }, "-=0.15");
    });
    return () => ctx.revert();
  }, []);
  return null;
}
