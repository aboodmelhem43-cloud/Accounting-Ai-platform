"use client";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // seconds for one full pass
  direction?: "left" | "right";
  className?: string;
}

export function Marquee({ children, speed = 28, direction = "left", className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="flex w-max gap-4"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
        }}
      >
        {children}
        {/* duplicate for seamless loop */}
        {children}
      </div>
    </div>
  );
}
