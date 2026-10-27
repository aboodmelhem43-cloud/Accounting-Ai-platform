"use client";

import { useEffect } from "react";
import gsap from "gsap";

export function InvoicesAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".gsap-invoices-header", {
        y: -20,
        opacity: 0,
        duration: 0.45,
      });

      tl.from(".gsap-invoices-filters", {
        y: 10,
        opacity: 0,
        duration: 0.35,
      }, "-=0.2");

      tl.from(".gsap-invoices-table", {
        y: 24,
        opacity: 0,
        duration: 0.45,
      }, "-=0.15");

      tl.from(".gsap-invoice-row", {
        x: -18,
        opacity: 0,
        duration: 0.3,
        stagger: 0.04,
      }, "-=0.3");
    });

    return () => ctx.revert();
  }, []);

  return null;
}
