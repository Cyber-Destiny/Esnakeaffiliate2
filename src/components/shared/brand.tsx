"use client";

import { cn } from "@/lib/utils";

export function SnakeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-7 w-7", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ensnake-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="var(--neon)" />
          <stop offset="100%" stopColor="color-mix(in oklch, var(--neon) 50%, transparent)" />
        </linearGradient>
      </defs>
      <path
        d="M34 6c-6 0-9 4-9 8 0 3 2 5 5 6l5 2c3 1 5 3 5 6 0 4-4 7-9 7-4 0-7-2-8-5"
        stroke="url(#ensnake-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 42c6 0 9-4 9-8 0-3-2-5-5-6l-5-2c-3-1-5-3-5-6 0-4 4-7 9-7 4 0 7 2 8 5"
        stroke="url(#ensnake-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="34" cy="9" r="2.2" fill="var(--neon)" />
    </svg>
  );
}

export function Brand({
  className,
  size = "md",
  onClick,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const mark = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 select-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-card border border-border/60 neon-glow-sm transition-transform group-hover:scale-105",
          size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <SnakeMark className={mark} />
      </span>
      <span className={cn("font-bold tracking-tight leading-none", text)}>
        ENSNAKE
        <span className="text-neon neon-text-glow">.</span>
      </span>
    </button>
  );
}
