/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React from "react";
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Lock, ShieldCheck, UserRound, UsersRound } from "lucide-react";

const tokens = {
  primary: "#003366",
  gold: "#D4AF37",
  white: "#FFFFFF",
  surface: "#F8F9FA",
  text: "#1A1A1A",
  muted: "#4D5A66",
  focus: "#005FCC",
  warmTop: "#F7F3EC",
  warmMid: "#F2EFE8",
  warmBottom: "#EDE9E2",
  warmPanel: "#FBF7EF",
  ink: "#07131D",
  ink2: "#0D1824",
  private: "#5B4B8A",
  members: "#00695C",
  publicSafe: "#2E7D32",
  warning: "#ED6C02",
  error: "#C62828",
};

function LogoMark() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/45 bg-white shadow-sm" aria-label="IWFSA logo placeholder">
      <div className="text-center font-serif text-[10px] leading-tight text-[#003366]">
        <div className="text-[15px] font-semibold">IWF</div>
        <div>SA</div>
      </div>
    </div>
  );
}

function StatusBadge({ children, tone = "members" }) {
  const color = {
    private: tokens.private,
    members: tokens.members,
    publicSafe: tokens.publicSafe,
    warning: tokens.warning,
    neutral: tokens.primary,
  }[tone];

  return (
    <span
      className="inline-flex min-h-7 items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold"
      style={{ borderColor: `${color}33`, color }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children }) {
  return (
    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#D4AF37] bg-[#003366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#072b4f] focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2">
      {children}
      <ChevronRight size={17} aria-hidden="true" />
    </button>
  );
}

function QuietLink({ children }) {
  return (
    <a href="#" className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm font-semibold text-[#003366] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FCC]">
      {children}
      <ChevronRight size={15} aria-hidden="true" />
    </a>
  );
}

function SurfaceCard({ children, className = "" }) {
  return (
    <section className={`rounded-lg border border-[#003366]/10 bg-white shadow-[0_14px_36px_rgba(7,19,29,0.07)] ${className}`}>
      {children}
    </section>
  );
}

function StatusRow({ icon: Icon, label, value, badge, tone }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#003366]/10 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FBF7EF] text-[#003366]">
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
          <p className="truncate text-sm text-[#4D5A66]">{value}</p>
        </div>
      </div>
      <StatusBadge tone={tone}>{badge}</StatusBadge>
    </div>
  );
}

function PriorityItem({ number, title, description, action, primary = false }) {
  return (
    <div className="grid gap-4 border-b border-[#003366]/10 py-6 last:border-b-0 md:grid-cols-[48px_1fr_auto] md:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#FBF7EF] text-sm font-bold text-[#003366]">
        {number}
      </div>
      <div>
        <h3 className="font-serif text-xl leading-snug text-[#1A1A1A]">{title}</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#4D5A66]">{description}</p>
      </div>
      <div className="md:justify-self-end">{primary ? <PrimaryButton>{action}</PrimaryButton> : <QuietLink>{action}</QuietLink>}</div>
    </div>
  );
}

function NoticeRow({ type, title, detail, tone = "members" }) {
  const color = {
    members: tokens.members,
    warning: tokens.warning,
    private: tokens.private,
    neutral: tokens.primary,
  }[tone];

  return (
    <div className="flex gap-3 py-4">
      <div className="mt-1 h-10 w-1 rounded-full" style={{ background: color }} aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-normal text-[#4D5A66]">{type}</p>
        <p className="mt-1 text-sm font-semibold text-[#1A1A1A]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#4D5A66]">{detail}</p>
      </div>
    </div>
  );
}

export default function IwfsaMemberDashboardPreview() {
  return (
    <main
      className="min-h-screen font-sans text-[#1A1A1A]"
      style={{
        background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 48%, ${tokens.warmBottom} 100%)`,
      }}
    >
      <header className="border-b border-[#D4AF37]/30 bg-[#07131D] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <LogoMark />
            <div>
              <p className="font-serif text-xl leading-tight text-white md:text-2xl">International Women&apos;s Forum South Africa</p>
              <p className="mt-1 text-sm text-white/72">Member workspace</p>
            </div>
          </div>
          <nav aria-label="Member navigation" className="flex gap-1 overflow-x-auto pb-1 text-sm font-semibold text-white/78">
            {[
              ["Dashboard", true],
              ["Profile", false],
              ["Events", false],
              ["Directory", false],
              ["Notifications", false],
            ].map(([item, active]) => (
              <a
                key={item}
                href="#"
                className={`min-h-11 shrink-0 rounded-full px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] ${
                  active ? "bg-[#D4AF37] text-[#07131D]" : "hover:bg-white/10"
                }`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-lg border border-[#D4AF37]/25 bg-[#07131D] shadow-[0_20px_50px_rgba(7,19,29,0.18)]">
          <div className="relative grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1fr_320px] lg:px-12 lg:py-12">
            <div className="absolute inset-0 opacity-20" aria-hidden="true">
              <div className="h-full w-full bg-[radial-gradient(circle_at_85%_10%,#D4AF37_0,transparent_28%),linear-gradient(135deg,#07131D_0%,#0D1824_48%,#111D29_100%)]" />
            </div>
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-normal text-[#D4AF37]">Member workspace</p>
              <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-white md:text-5xl">Welcome back, Ayanda</h1>
              <p className="mt-4 max-w-2xl font-serif text-xl italic leading-8 text-white/82">
                A calm place to manage your IWFSA presence, participation, and member connections.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton>Complete profile</PrimaryButton>
                <a href="#" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-white/88 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#005FCC]">
                  Review upcoming events
                </a>
              </div>
            </div>
            <div className="relative rounded-lg border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Standing</p>
              <div className="mt-4 flex items-center gap-3">
                <CheckCircle2 className="text-[#D4AF37]" size={24} aria-hidden="true" />
                <div>
                  <p className="font-serif text-2xl text-white">Good standing</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">Your member access is active.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <SurfaceCard className="p-6 md:p-8 lg:col-span-8">
            <div className="flex flex-col gap-2 border-b border-[#003366]/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[#6A4A00]">Today</p>
                <h2 className="mt-2 font-serif text-3xl text-[#1A1A1A]">Today&apos;s member priorities</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#4D5A66]">One clear next step, with quieter paths for everything else.</p>
            </div>

            <PriorityItem
              number="1"
              title="Complete your profile visibility review"
              description="Your profile is saved privately until visibility and consent are confirmed. You decide what remains private, member-only, or public-safe."
              action="Complete profile"
              primary
            />
            <PriorityItem
              number="2"
              title="RSVP for the next leadership event"
              description="Two member events are open for registration. Review capacity, location, and participation status before you respond."
              action="Review events"
            />
            <PriorityItem
              number="3"
              title="Review notification preferences"
              description="Email notices are active. SMS is not enabled. You can adjust annual communication preferences when ready."
              action="Manage preferences"
            />
          </SurfaceCard>

          <SurfaceCard className="p-6 md:p-7 lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-[#6A4A00]">Status summary</p>
            <h2 className="mt-2 font-serif text-2xl text-[#1A1A1A]">Your member status</h2>
            <div className="mt-5">
              <StatusRow icon={UserRound} label="Profile" value="Needs visibility review" badge="Private" tone="private" />
              <StatusRow icon={CalendarDays} label="Events" value="2 available" badge="Open" tone="members" />
              <StatusRow icon={UsersRound} label="Directory" value="Consent required" badge="Members only" tone="members" />
              <StatusRow icon={Bell} label="Notifications" value="3 unread" badge="Action" tone="warning" />
            </div>
          </SurfaceCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <SurfaceCard className="p-6 md:p-7 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[#6A4A00]">Upcoming member event</p>
                <h2 className="mt-2 font-serif text-2xl text-[#1A1A1A]">Leadership Roundtable</h2>
              </div>
              <StatusBadge tone="members">Member-only</StatusBadge>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#4D5A66]">
              <p><strong className="text-[#1A1A1A]">Thursday, 22 May</strong> - 17:30</p>
              <p>Johannesburg leadership venue - 18 spaces remaining</p>
            </div>
            <div className="mt-5">
              <QuietLink>Review events</QuietLink>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6 md:p-7 lg:col-span-7">
            <div className="flex items-center justify-between gap-4 border-b border-[#003366]/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[#6A4A00]">Recent notices</p>
                <h2 className="mt-2 font-serif text-2xl text-[#1A1A1A]">Calm message centre</h2>
              </div>
              <ShieldCheck className="text-[#003366]" size={25} aria-hidden="true" />
            </div>
            <NoticeRow type="Events" title="RSVPs are open" detail="The May leadership roundtable is available for member registration." tone="members" />
            <NoticeRow type="Standing" title="Member access is active" detail="Your current standing allows access to member services." tone="neutral" />
            <NoticeRow type="Administration" title="Preferences can be reviewed" detail="Annual communication preferences are available in notifications." tone="warning" />
          </SurfaceCard>
        </div>

        <section className="mt-6 rounded-lg border border-[#00695C]/20 bg-[#FBF7EF] p-5 text-sm leading-6 text-[#4D5A66]">
          <div className="flex gap-3">
            <Lock className="mt-0.5 shrink-0 text-[#00695C]" size={20} aria-hidden="true" />
            <p>
              <strong className="text-[#1A1A1A]">Privacy note:</strong> member dashboard information is shown inside the protected member workspace. Public-safe visibility is controlled separately through profile consent and approval.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
