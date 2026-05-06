/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Gift,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

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
  heroInk: "#07131D",
  private: "#5B4B8A",
  members: "#00695C",
  publicSafe: "#2E7D32",
  audit: "#6A4A00",
  warning: "#ED6C02",
  error: "#C62828",
};

const notices = [
  {
    group: "Events",
    icon: CalendarDays,
    accent: tokens.members,
    title: "Leadership roundtable RSVP confirmed",
    body: "You are confirmed for the Johannesburg member roundtable. Arrival details will be sent closer to the event.",
    date: "12 Jun 2026",
    status: "Unread",
    strength: "new",
  },
  {
    group: "Events",
    icon: CalendarDays,
    accent: tokens.warning,
    title: "Cape Town forum waitlist update",
    body: "You remain on the waitlist. We will notify you when a place becomes available.",
    date: "08 Jun 2026",
    status: "Action noted",
    strength: "notice",
  },
  {
    group: "Membership standing",
    icon: ShieldCheck,
    accent: tokens.audit,
    title: "Annual standing review complete",
    body: "Your member standing is current for the annual review period.",
    date: "03 Jun 2026",
    status: "Sent",
    strength: "quiet",
  },
  {
    group: "Celebrations",
    icon: Gift,
    accent: tokens.publicSafe,
    title: "Member milestone this month",
    body: "A fellow member is being recognised for public leadership work. You may send a private congratulatory note from the directory.",
    date: "01 Jun 2026",
    status: "Informational",
    strength: "quiet",
  },
  {
    group: "Administrative notices",
    icon: CircleAlert,
    accent: tokens.warning,
    title: "Review notification preferences",
    body: "Please confirm whether email, SMS, and in-app notices still match how you prefer to be contacted.",
    date: "28 May 2026",
    status: "Action needed",
    strength: "action",
  },
];

const groupOrder = ["Events", "Membership standing", "Celebrations", "Administrative notices"];

function Header() {
  const nav = ["Dashboard", "Profile", "Events", "Directory", "Notifications"];
  return (
    <header className="border-b border-white/10 bg-[#07131D] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded bg-white p-2 shadow-sm">
            <img
              src="/legacy-assets/iwfsa-logo.svg"
              alt="IWFSA logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <p className="font-[Georgia] text-xl leading-tight md:text-2xl">
              International Women&apos;s Forum South Africa
            </p>
            <p className="mt-1 text-sm text-white/72">Member workspace - Notifications</p>
          </div>
        </div>

        <nav aria-label="Member navigation" className="flex flex-wrap gap-2">
          {nav.map((item) => {
            const active = item === "Notifications";
            return (
              <a
                key={item}
                href="#"
                aria-current={active ? "page" : undefined}
                className={`min-h-11 rounded px-3 py-2 text-sm transition focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#005FCC] ${
                  active
                    ? "bg-[#D4AF37] text-[#07131D]"
                    : "text-white/82 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function StatusPill({ children, tone = "quiet" }) {
  const styles = {
    new: "border-[#00695C]/25 bg-[#00695C]/10 text-[#00695C]",
    action: "border-[#ED6C02]/30 bg-[#ED6C02]/10 text-[#6A4A00]",
    notice: "border-[#D4AF37]/40 bg-[#FBF7EF] text-[#6A4A00]",
    quiet: "border-slate-200 bg-white text-[#4D5A66]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

function PreferenceToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-[#003366]/12 bg-white p-4 shadow-[0_10px_26px_rgba(7,19,29,0.05)] transition hover:border-[#003366]/28">
      <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F9FA] text-[#003366]">
        <Icon size={19} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#1A1A1A]">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[#4D5A66]">{description}</span>
      </span>
      <span className="relative mt-1 inline-flex h-7 w-12 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          aria-label={`${title} preference`}
        />
        <span className="absolute inset-0 rounded-full border border-[#003366]/20 bg-[#EDE9E2] transition peer-checked:border-[#003366] peer-checked:bg-[#003366] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#005FCC]" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function NoticeRow({ notice }) {
  const Icon = notice.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`grid gap-4 rounded-lg border bg-white p-4 shadow-[0_12px_32px_rgba(7,19,29,0.055)] md:grid-cols-[auto_1fr_auto] md:items-start ${
        notice.strength === "action" ? "border-[#ED6C02]/35" : "border-[#003366]/12"
      }`}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: `${notice.accent}14`, color: notice.accent }}
        aria-hidden="true"
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-[Georgia] text-xl leading-snug text-[#1A1A1A]">{notice.title}</h3>
          <StatusPill tone={notice.strength}>{notice.status}</StatusPill>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#4D5A66]">{notice.body}</p>
        <p className="mt-3 text-xs font-medium text-[#4D5A66]">{notice.date}</p>
      </div>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#003366]/18 bg-[#FBF7EF] px-3 text-sm font-semibold text-[#003366] transition hover:border-[#003366]/35 hover:bg-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#005FCC] md:justify-self-end">
        View
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </motion.article>
  );
}

function StateSamples() {
  return (
    <section aria-labelledby="states-title" className="rounded-lg border border-[#003366]/12 bg-white p-5 shadow-[0_14px_34px_rgba(7,19,29,0.055)]">
      <h2 id="states-title" className="font-[Georgia] text-2xl text-[#1A1A1A]">Designed states</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded border border-[#2E7D32]/24 bg-[#2E7D32]/8 p-3 text-[#1A1A1A]">
          <strong className="text-[#2E7D32]">Success:</strong> Preferences saved. Your selected channels are now active.
        </div>
        <div className="rounded border border-[#ED6C02]/24 bg-[#ED6C02]/8 p-3 text-[#1A1A1A]">
          <strong className="text-[#6A4A00]">Warning:</strong> SMS delivery needs a verified mobile number before activation.
        </div>
        <div className="rounded border border-[#C62828]/24 bg-[#C62828]/8 p-3 text-[#1A1A1A]">
          <strong className="text-[#C62828]">Error:</strong> Preferences could not be saved. Please try again.
        </div>
        <div className="rounded border border-[#003366]/12 bg-[#F8F9FA] p-3 text-[#4D5A66]">
          <strong className="text-[#003366]">Empty:</strong> There are no current notifications in this category.
        </div>
        <div className="rounded border border-[#003366]/12 bg-white p-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-[#EDE9E2]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#EDE9E2]" />
        </div>
      </div>
    </section>
  );
}

export default function MemberNotificationsPreview() {
  const [prefs, setPrefs] = useState({ email: true, sms: false, app: true });
  const grouped = useMemo(() => {
    return groupOrder.map((group) => ({ group, items: notices.filter((notice) => notice.group === group) }));
  }, []);

  const unreadCount = notices.filter((notice) => notice.status === "Unread").length;
  const actionCount = notices.filter((notice) => notice.status === "Action needed").length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7F3EC] via-[#F2EFE8] to-[#EDE9E2] text-[#1A1A1A]">
      <Header />

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="rounded-lg bg-[#07131D] p-6 text-white shadow-[0_22px_60px_rgba(7,19,29,0.22)] lg:col-span-8 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#D4AF37]">Member notifications</p>
            <h1 className="mt-3 max-w-3xl font-[Georgia] text-4xl leading-tight md:text-5xl">
              Notices gathered with calm attention.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/76">
              Review event updates, membership standing messages, celebrations, and administrative notices without the noise of a general inbox.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#D4AF37] bg-[#003366] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00294f] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#005FCC]">
                <CheckCircle2 size={17} aria-hidden="true" />
                Review preferences
              </button>
              <button className="inline-flex min-h-11 items-center justify-center rounded border border-white/22 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/14 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#005FCC]">
                Mark visible notices as read
              </button>
            </div>
          </div>

          <aside className="rounded-lg border border-[#003366]/12 bg-[#FBF7EF] p-6 shadow-[0_14px_34px_rgba(7,19,29,0.06)] lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003366] text-white">
                <Bell size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#003366]">Notification standing</p>
                <p className="text-sm text-[#4D5A66]">Annual preference status active</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded border border-[#003366]/10 bg-white p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[#4D5A66]">Unread</dt>
                <dd className="mt-2 font-[Georgia] text-3xl text-[#003366]">{unreadCount}</dd>
              </div>
              <div className="rounded border border-[#ED6C02]/20 bg-white p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[#4D5A66]">Action</dt>
                <dd className="mt-2 font-[Georgia] text-3xl text-[#6A4A00]">{actionCount}</dd>
              </div>
            </dl>
            <p className="mt-5 rounded border border-[#D4AF37]/35 bg-white p-3 text-sm leading-6 text-[#4D5A66]">
              Private member notices remain inside the member workspace. Public-facing announcements are managed separately through approved public-safe workflows.
            </p>
          </aside>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-12">
          <section aria-labelledby="preferences-title" className="lg:col-span-4">
            <div className="sticky top-4 space-y-5">
              <div className="rounded-lg border border-[#003366]/12 bg-white p-5 shadow-[0_14px_34px_rgba(7,19,29,0.055)]">
                <h2 id="preferences-title" className="font-[Georgia] text-2xl text-[#1A1A1A]">Preference controls</h2>
                <p className="mt-2 text-sm leading-6 text-[#4D5A66]">
                  Select the channels that suit how you wish to receive member notices.
                </p>
                <div className="mt-5 space-y-3">
                  <PreferenceToggle
                    icon={Mail}
                    title="Email"
                    description="Formal notices and event confirmations."
                    checked={prefs.email}
                    onChange={() => setPrefs((p) => ({ ...p, email: !p.email }))}
                  />
                  <PreferenceToggle
                    icon={Smartphone}
                    title="SMS"
                    description="Urgent reminders only when enabled."
                    checked={prefs.sms}
                    onChange={() => setPrefs((p) => ({ ...p, sms: !p.sms }))}
                  />
                  <PreferenceToggle
                    icon={MessageSquareText}
                    title="In-app"
                    description="Quiet notices inside this workspace."
                    checked={prefs.app}
                    onChange={() => setPrefs((p) => ({ ...p, app: !p.app }))}
                  />
                </div>
                <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded border border-[#D4AF37] bg-[#003366] px-5 text-sm font-semibold text-white transition hover:bg-[#00294f] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#005FCC]">
                  Save preference choices
                </button>
              </div>

              <div className="rounded-lg border border-[#00695C]/18 bg-[#FBF7EF] p-5">
                <div className="flex gap-3">
                  <UserRoundCheck className="mt-0.5 text-[#00695C]" size={20} aria-hidden="true" />
                  <div>
                    <h3 className="font-[Georgia] text-xl text-[#1A1A1A]">Consent-aware notices</h3>
                    <p className="mt-2 text-sm leading-6 text-[#4D5A66]">
                      Directory and profile-related notices respect member consent and visibility boundaries.
                    </p>
                  </div>
                </div>
              </div>

              <StateSamples />
            </div>
          </section>

          <section aria-labelledby="notice-list-title" className="lg:col-span-8">
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#003366]/12 bg-white p-4 shadow-[0_10px_24px_rgba(7,19,29,0.045)] md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="notice-list-title" className="font-[Georgia] text-2xl text-[#1A1A1A]">Current notices</h2>
                <p className="mt-1 text-sm text-[#4D5A66]">Grouped by member context for easier review.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <StatusPill tone="new">Unread</StatusPill>
                <StatusPill tone="action">Action needed</StatusPill>
                <StatusPill tone="quiet">Sent</StatusPill>
              </div>
            </div>

            <div className="space-y-7">
              {grouped.map(({ group, items }) => (
                <section key={group} aria-labelledby={`${group.replace(/\s+/g, "-").toLowerCase()}-heading`}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[#003366]/14" />
                    <h3 id={`${group.replace(/\s+/g, "-").toLowerCase()}-heading`} className="font-[Georgia] text-xl text-[#003366]">
                      {group}
                    </h3>
                    <span className="h-px flex-1 bg-[#003366]/14" />
                  </div>
                  {items.length ? (
                    <div className="space-y-3">
                      {items.map((notice) => (
                        <NoticeRow key={notice.title} notice={notice} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#003366]/12 bg-[#FBF7EF] p-5 text-sm text-[#4D5A66]">
                      No current notifications in this category.
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-7 rounded-lg border border-[#D4AF37]/35 bg-[#FBF7EF] p-5">
              <div className="flex gap-3">
                <Sparkles className="mt-1 shrink-0 text-[#D4AF37]" size={20} aria-hidden="true" />
                <div>
                  <h3 className="font-[Georgia] text-xl text-[#1A1A1A]">Quiet by design</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4D5A66]">
                    This page is intentionally not an inbox. It gives members the few signals that matter, then lets them return to leadership work without administrative noise.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
