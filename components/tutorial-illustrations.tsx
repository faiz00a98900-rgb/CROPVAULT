"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Hand-built SVG illustrations for the Tutorial. They are intentionally
 * lightweight (no external image files) and echo the app's neumorphic
 * beige/green aesthetic so the walkthrough feels native to CropVault.
 */

const BASE = "#F1EDE3";
const INK = "#2E3A2F";
const SOFT = "#7C847B";
const LEAF = "#2F6B3B";
const LEAF_SOFT = "#4C8A58";
const AMBER = "#C68A20";
const CHILI = "#B23A3A";
const SKY = "#3A6EA5";

function Frame({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/60 bg-base shadow-neu",
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/60 bg-white/40 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-chili/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-leaf/60" />
        {label && (
          <span className="ml-2 text-[11px] font-semibold text-ink-faint">{label}</span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* Sidebar + top bar shell used by several scenes. */
function Shell({ body }: { body: ReactNode }) {
  return (
    <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
      <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
      {/* sidebar */}
      <rect x="8" y="8" width="58" height="174" rx="8" fill="#ffffff" opacity="0.5" />
      <circle cx="24" cy="24" r="7" fill={LEAF} />
      {[44, 60, 76, 92, 108].map((y) => (
        <g key={y}>
          <rect x="16" y={y} width="10" height="10" rx="3" fill={LEAF_SOFT} opacity="0.7" />
          <rect x="30" y={y + 3} width="28" height="4" rx="2" fill={SOFT} opacity="0.5" />
        </g>
      ))}
      {/* top bar */}
      <rect x="72" y="8" width="240" height="26" rx="8" fill="#ffffff" opacity="0.55" />
      <rect x="80" y="16" width="90" height="10" rx="5" fill={SOFT} opacity="0.35" />
      <rect x="214" y="14" width="42" height="14" rx="7" fill={LEAF} opacity="0.15" />
      <circle cx="298" cy="21" r="8" fill={LEAF} />
      {/* body */}
      {body}
    </svg>
  );
}

export function IllusDashboard() {
  return (
    <Frame label="Dashboard">
      <Shell
        body={
          <g>
            {[
              { x: 72, c: LEAF },
              { x: 134, c: SKY },
              { x: 196, c: LEAF_SOFT },
              { x: 258, c: CHILI },
            ].map((k) => (
              <g key={k.x}>
                <rect x={k.x} y="42" width="54" height="34" rx="6" fill="#fff" opacity="0.6" />
                <rect x={k.x + 6} y="48" width="14" height="14" rx="4" fill={k.c} opacity="0.85" />
                <rect x={k.x + 6} y="66" width="34" height="5" rx="2.5" fill={INK} opacity="0.5" />
              </g>
            ))}
            {/* donut */}
            <circle cx="120" cy="132" r="30" fill="none" stroke={LEAF} strokeWidth="12" strokeDasharray="70 200" />
            <circle cx="120" cy="132" r="30" fill="none" stroke={AMBER} strokeWidth="12" strokeDasharray="45 200" strokeDashoffset="-70" />
            <circle cx="120" cy="132" r="30" fill="none" stroke={SKY} strokeWidth="12" strokeDasharray="40 200" strokeDashoffset="-115" />
            <circle cx="120" cy="132" r="30" fill="none" stroke={LEAF_SOFT} strokeWidth="12" strokeDasharray="35 200" strokeDashoffset="-155" />
            {/* attention list */}
            {[96, 118, 140].map((y) => (
              <g key={y}>
                <rect x="176" y={y} width="136" height="18" rx="5" fill="#fff" opacity="0.6" />
                <circle cx="188" cy={y + 9} r="5" fill={LEAF_SOFT} />
                <rect x="198" y={y + 4} width="60" height="4" rx="2" fill={INK} opacity="0.45" />
                <rect x="198" y={y + 10} width="40" height="3" rx="1.5" fill={SOFT} opacity="0.5" />
                <rect x="286" y={y + 5} width="20" height="8" rx="4" fill={y === 140 ? CHILI : AMBER} opacity="0.85" />
              </g>
            ))}
          </g>
        }
      />
    </Frame>
  );
}

export function IllusWarehouseSwitch() {
  return (
    <Frame label="Warehouses">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        <rect x="16" y="16" width="150" height="24" rx="8" fill="#fff" opacity="0.6" />
        <rect x="26" y="24" width="80" height="8" rx="4" fill={LEAF} opacity="0.7" />
        <path d="M150 24l8 8 8-8" stroke={SOFT} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[
          { y: 54, active: true },
          { y: 96, active: false },
          { y: 138, active: false },
        ].map((w) => (
          <g key={w.y}>
            <rect
              x="16"
              y={w.y}
              width="288"
              height="34"
              rx="8"
              fill="#fff"
              opacity={w.active ? 0.85 : 0.5}
              stroke={w.active ? LEAF : "none"}
              strokeWidth={w.active ? 2 : 0}
            />
            <rect x="26" y={w.y + 8} width="18" height="18" rx="5" fill={w.active ? LEAF : LEAF_SOFT} opacity="0.85" />
            <rect x="54" y={w.y + 10} width="70" height="6" rx="3" fill={INK} opacity="0.5" />
            <rect x="54" y={w.y + 20} width="120" height="4" rx="2" fill={SOFT} opacity="0.5" />
            <rect x="250" y={w.y + 12} width="44" height="10" rx="5" fill={AMBER} opacity="0.3" />
          </g>
        ))}
      </svg>
    </Frame>
  );
}

export function IllusAddInventory() {
  return (
    <Frame label="Add Inventory">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        <rect x="16" y="14" width="120" height="16" rx="6" fill={LEAF} opacity="0.15" />
        <rect x="24" y="19" width="70" height="6" rx="3" fill={LEAF} opacity="0.8" />
        {/* toggle scan/manual */}
        <rect x="150" y="14" width="60" height="16" rx="8" fill="#fff" opacity="0.6" />
        <rect x="214" y="14" width="90" height="16" rx="8" fill={LEAF} opacity="0.85" />
        {/* form fields */}
        {[42, 74, 106].map((y, i) => (
          <g key={y}>
            <rect x="16" y={y} width="140" height="26" rx="6" fill="#fff" opacity="0.6" />
            <rect x="24" y={y + 4} width="40" height="4" rx="2" fill={SOFT} opacity="0.6" />
            <rect x="24" y={y + 13} width={i === 2 ? 60 : 90} height="6" rx="3" fill={INK} opacity="0.35" />
          </g>
        ))}
        <rect x="168" y="42" width="136" height="90" rx="8" fill="#fff" opacity="0.5" />
        <circle cx="236" cy="78" r="20" fill={LEAF} opacity="0.12" />
        <path d="M228 78l6 6 12-14" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="200" y="106" width="72" height="6" rx="3" fill={SOFT} opacity="0.5" />
        <rect x="16" y="150" width="288" height="26" rx="8" fill={LEAF} />
        <rect x="120" y="160" width="80" height="6" rx="3" fill="#fff" opacity="0.9" />
      </svg>
    </Frame>
  );
}

export function IllusMovement() {
  return (
    <Frame label="Stock Movement">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        {/* action chips */}
        {[
          { x: 16, c: LEAF },
          { x: 78, c: SKY },
          { x: 140, c: AMBER },
          { x: 202, c: CHILI },
          { x: 252, c: CHILI },
        ].map((a) => (
          <g key={a.x}>
            <rect x={a.x} y="16" width="56" height="22" rx="8" fill={a.c} opacity="0.18" />
            <rect x={a.x + 8} y="24" width="40" height="6" rx="3" fill={a.c} opacity="0.85" />
          </g>
        ))}
        {/* transfer visual */}
        <rect x="30" y="70" width="90" height="50" rx="8" fill="#fff" opacity="0.6" />
        <rect x="200" y="70" width="90" height="50" rx="8" fill="#fff" opacity="0.6" />
        <rect x="42" y="82" width="40" height="6" rx="3" fill={INK} opacity="0.45" />
        <rect x="42" y="96" width="60" height="10" rx="4" fill={LEAF} opacity="0.5" />
        <rect x="212" y="82" width="40" height="6" rx="3" fill={INK} opacity="0.45" />
        <rect x="212" y="96" width="60" height="10" rx="4" fill={SKY} opacity="0.5" />
        <path d="M128 95h60m0 0l-10-8m10 8l-10 8" stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="16" y="140" width="288" height="14" rx="6" fill={AMBER} opacity="0.15" />
        <rect x="16" y="160" width="288" height="14" rx="6" fill={LEAF} opacity="0.12" />
      </svg>
    </Frame>
  );
}

export function IllusAlerts() {
  return (
    <Frame label="Alerts">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        {/* summary */}
        {[
          { x: 16, c: CHILI, w: 90 },
          { x: 116, c: AMBER, w: 90 },
          { x: 216, c: LEAF, w: 88 },
        ].map((s) => (
          <g key={s.x}>
            <rect x={s.x} y="14" width={s.w} height="30" rx="8" fill="#fff" opacity="0.6" />
            <rect x={s.x + 8} y="20" width="24" height="10" rx="4" fill={s.c} opacity="0.85" />
            <rect x={s.x + 8} y="34" width="40" height="5" rx="2.5" fill={SOFT} opacity="0.5" />
          </g>
        ))}
        {/* alert rows */}
        {[56, 92, 128, 164].map((y, i) => (
          <g key={y}>
            <rect x="16" y={y} width="288" height="28" rx="8" fill="#fff" opacity="0.55" />
            <circle cx="32" cy={y + 14} r="7" fill={i % 2 ? AMBER : CHILI} opacity="0.85" />
            <rect x="46" y={y + 7} width="90" height="5" rx="2.5" fill={INK} opacity="0.5" />
            <rect x="46" y={y + 16} width="150" height="4" rx="2" fill={SOFT} opacity="0.5" />
            <rect x="256" y={y + 7} width="40" height="14" rx="7" fill={LEAF} opacity={i === 3 ? 0.85 : 0.15} />
          </g>
        ))}
      </svg>
    </Frame>
  );
}

export function IllusReports() {
  return (
    <Frame label="Reports">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        <rect x="16" y="16" width="288" height="120" rx="8" fill="#fff" opacity="0.55" />
        {[
          { x: 40, h: 40, c: LEAF },
          { x: 84, h: 70, c: SKY },
          { x: 128, h: 55, c: AMBER },
          { x: 172, h: 90, c: LEAF_SOFT },
          { x: 216, h: 65, c: CHILI },
          { x: 260, h: 48, c: LEAF },
        ].map((b) => (
          <rect key={b.x} x={b.x} y={136 - b.h} width="24" height={b.h} rx="4" fill={b.c} opacity="0.8" />
        ))}
        <line x1="28" y1="136" x2="292" y2="136" stroke={SOFT} strokeWidth="2" opacity="0.5" />
        {[150, 168].map((y) => (
          <rect key={y} x="16" y={y} width="288" height="12" rx="5" fill="#fff" opacity="0.5" />
        ))}
      </svg>
    </Frame>
  );
}

export function IllusSecurity() {
  return (
    <Frame label="Security">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        <path d="M60 24l28 10v26c0 20-14 32-28 38-14-6-28-18-28-38V34z" fill={LEAF} opacity="0.85" />
        <path d="M46 56l10 10 18-20" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* user list */}
        {[40, 78, 116, 154].map((x, i) => (
          <g key={x}>
            <rect x="108" y={x - 20} width="196" height="30" rx="8" fill="#fff" opacity="0.55" />
            <circle cx="126" cy={x - 5} r="9" fill={i === 0 ? LEAF : SKY} opacity="0.85" />
            <rect x="142" y={x - 12} width="70" height="5" rx="2.5" fill={INK} opacity="0.5" />
            <rect x="142" y={x - 3} width="40" height="4" rx="2" fill={SOFT} opacity="0.5" />
            <rect x="256" y={x - 12} width="40" height="14" rx="7" fill={i === 0 ? LEAF : SOFT} opacity="0.25" />
          </g>
        ))}
      </svg>
    </Frame>
  );
}

export function IllusLanguage() {
  return (
    <Frame label="Language">
      <svg viewBox="0 0 320 190" className="h-auto w-full" role="img">
        <rect x="0" y="0" width="320" height="190" rx="10" fill={BASE} />
        <circle cx="60" cy="60" r="26" fill="none" stroke={LEAF} strokeWidth="3" />
        <path d="M34 60h52M60 34c10 14 10 38 0 52M60 34c-10 14-10 38 0 52" stroke={LEAF} strokeWidth="2.5" fill="none" />
        {/* dropdown */}
        <rect x="110" y="40" width="120" height="24" rx="8" fill="#fff" opacity="0.7" stroke={LEAF} strokeWidth="1.5" />
        <text x="124" y="57" fontSize="15" fontWeight="700" fill={INK}>English</text>
        <rect x="110" y="74" width="150" height="90" rx="10" fill="#fff" opacity="0.85" stroke={SOFT} strokeOpacity="0.3" />
        {[
          { y: 90, t: "English", on: true },
          { y: 118, t: "हिन्दी", on: false },
          { y: 146, t: "मराठी", on: false },
        ].map((o) => (
          <g key={o.y}>
            {o.on && <rect x="116" y={o.y - 12} width="138" height="22" rx="6" fill={LEAF} opacity="0.12" />}
            <text x="128" y={o.y + 4} fontSize="15" fontWeight="700" fill={o.on ? LEAF : INK}>{o.t}</text>
          </g>
        ))}
      </svg>
    </Frame>
  );
}
