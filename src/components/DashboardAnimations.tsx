"use client";

import { useEffect } from "react";
import gsap from "gsap";

/**
 * Mounts alongside the server-rendered dashboard and runs GSAP entrance
 * animations by targeting CSS classes added to the static HTML.
 * Returns null — purely a behaviour component.
 */
export function DashboardAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Stat cards stagger up
      tl.from(".gsap-stat-card", {
        y: 40,
        opacity: 0,
        duration: 0.55,
        stagger: 0.09,
      });

      // 2. Quick-action bar slides in
      tl.from(".gsap-quick-actions", {
        y: 20,
        opacity: 0,
        duration: 0.45,
      }, "-=0.25");

      // 3. Charts scale + fade in
      tl.from(".gsap-chart", {
        scale: 0.94,
        opacity: 0,
        duration: 0.55,
        stagger: 0.12,
      }, "-=0.2");

      // 4. Recent invoice rows slide in from the side
      tl.from(".gsap-recent-row", {
        x: -24,
        opacity: 0,
        duration: 0.35,
        stagger: 0.07,
      }, "-=0.3");

      // 5. Number values pop in with a slight scale
      tl.from(".gsap-stat-value", {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "back.out(1.5)",
      }, "<0.2");
    });

    return () => ctx.revert();
  }, []);

  return null;
}
