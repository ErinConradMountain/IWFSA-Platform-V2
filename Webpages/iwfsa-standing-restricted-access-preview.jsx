/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React from "react";
import { AlertTriangle, ArrowLeft, Mail, ShieldCheck, Clock, CheckCircle2, Loader2, XCircle } from "lucide-react";

const tokens = {
  navy: "#003366",
  gold: "#D4AF37",
  white: "#FFFFFF",
  soft: "#F8F9FA",
  text: "#1A1A1A",
  muted: "#4D5A66",
  focus: "#005FCC",
  warmTop: "#F7F3EC",
  warmMid: "#F2EFE8",
  warmBottom: "#EDE9E2",
  warmPanel: "#FBF7EF",
  ink: "#07131D",
  warning: "#ED6C02",
  error: "#C62828",
  success: "#2E7D32",
  audit: "#6A4A00",
};

function Header() {
  return (
    <header className="w-full border-b border-white/10" style={{ background: tokens.ink }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-white p-2 shadow-sm">
            <img src="/legacy-assets/iwfsa-logo.svg" alt="IWFSA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-serif text-xl leading-tight text-white md:text-2xl">International Women&apos;s Forum South Africa</p>
            <p className="mt-1 text-sm text-white/72">Member workspace - Standing</p>
          </div>
        </div>

        <nav aria-label="Member navigation" className="flex flex-wrap gap-2 text-sm">
          {["Dashboard", "Profile", "Events", "Directory", "Notifications"].map((item) => (
            <a
              key={item}
              href="#"
              className="min-h-11 rounded border border-white/12 px-4 py-3 text-white/82 transition hover:border-[#D4AF37] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 focus:ring-offset-[#07131D]"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function StatusPill({ children, tone = "warning" }) {
  const color = tone === "success" ? tokens.success : tone === "error" ? tokens.error : tokens.warning;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium"
      style={{ borderColor: `${color}55`, color, background: `${color}10` }}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, primary = false, icon: Icon }) {
  return (
    <a
      href="#"
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded px-5 py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 sm:w-auto"
      style={
        primary
          ? { background: tokens.navy, color: tokens.white, border: `1px solid ${tokens.gold}` }
          : { background: tokens.white, color: tokens.navy, border: `1px solid ${tokens.navy}33` }
      }
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </a>
  );
}

function NextStep({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4 rounded border border-[#00336614] bg-white p-5 shadow-[0_12px_28px_rgba(7,19,29,0.05)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded" style={{ background: `${tokens.navy}0D`, color: tokens.navy }}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-serif text-xl" style={{ color: tokens.text }}>{title}</h3>
        <p className="mt-1 text-sm leading-6" style={{ color: tokens.muted }}>{text}</p>
      </div>
    </div>
  );
}

function StateStrip() {
  return (
    <section aria-label="Designed access states" className="mt-10 grid gap-4 md:grid-cols-4">
      <div className="rounded border border-[#00336614] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.audit }}>
          <Clock className="h-4 w-4" /> Loading
        </div>
        <p className="mt-2 text-sm" style={{ color: tokens.muted }}>Checking standing status without exposing sensitive detail.</p>
      </div>
      <div className="rounded border border-[#2E7D3233] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.success }}>
          <CheckCircle2 className="h-4 w-4" /> Restored
        </div>
        <p className="mt-2 text-sm" style={{ color: tokens.muted }}>Access restored. Member can return to her intended action.</p>
      </div>
      <div className="rounded border border-[#ED6C0233] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.warning }}>
          <AlertTriangle className="h-4 w-4" /> Review
        </div>
        <p className="mt-2 text-sm" style={{ color: tokens.muted }}>Access is limited until standing is reviewed.</p>
      </div>
      <div className="rounded border border-[#C6282833] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.error }}>
          <XCircle className="h-4 w-4" /> Error
        </div>
        <p className="mt-2 text-sm" style={{ color: tokens.muted }}>A generic support message appears without technical detail.</p>
      </div>
    </section>
  );
}

export default function StandingRestrictedAccessPreview() {
  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 48%, ${tokens.warmBottom} 100%)`, color: tokens.text }}>
      <Header />

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8">
            <div className="rounded border border-[#0033661A] bg-white p-6 shadow-[0_20px_50px_rgba(7,19,29,0.08)] md:p-9">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <StatusPill>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Standing review required
                </StatusPill>
                <span className="text-sm" style={{ color: tokens.muted }}>Member action temporarily unavailable</span>
              </div>

              <h1 className="font-serif text-4xl leading-tight md:text-5xl" style={{ color: tokens.ink }}>
                Standing review required
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg" style={{ color: tokens.muted }}>
                Your access to this member action is temporarily limited while your membership standing is reviewed. This notice is here to guide you calmly to the right next step; it does not display private administrative details.
              </p>

              <div className="mt-8 rounded border-l-4 p-5" style={{ borderLeftColor: tokens.warning, background: tokens.warmPanel }}>
                <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>What this means</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
                  Some member features require an active standing check before they can be used. You can still return to your dashboard or contact the IWFSA administrator for assistance.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ActionButton primary icon={Mail}>Contact administrator</ActionButton>
                <ActionButton icon={ShieldCheck}>Review standing guidance</ActionButton>
                <ActionButton icon={ArrowLeft}>Return to dashboard</ActionButton>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded border border-[#0033661A] bg-[#FBF7EF] p-6 shadow-[0_16px_36px_rgba(7,19,29,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.audit }}>Private by design</p>
              <h2 className="mt-3 font-serif text-2xl" style={{ color: tokens.ink }}>No sensitive reason is shown here.</h2>
              <p className="mt-3 text-sm leading-6" style={{ color: tokens.muted }}>
                This member-facing screen gives practical next steps only. Internal audit notes, payment details, administrator comments, and standing history remain outside the member page.
              </p>
              <div className="mt-6 rounded border border-[#00336614] bg-white p-4">
                <p className="text-sm font-semibold" style={{ color: tokens.navy }}>Recommended copy tone</p>
                <p className="mt-2 font-serif text-lg italic leading-7" style={{ color: tokens.text }}>
                  Clear enough to act on. Gentle enough to preserve dignity.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <NextStep icon={Mail} title="Contact administrator" text="Send a respectful request for help without exposing private standing details on the page." />
          <NextStep icon={ShieldCheck} title="Review membership standing" text="Point the member toward the appropriate support path or policy guidance." />
          <NextStep icon={ArrowLeft} title="Return to dashboard" text="Give a safe path back into the member workspace when the blocked action cannot continue." />
        </section>

        <StateStrip />
      </section>
    </main>
  );
}
