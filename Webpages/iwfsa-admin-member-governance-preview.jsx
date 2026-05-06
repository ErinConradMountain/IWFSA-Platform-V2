/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileWarning,
  Filter,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

const tokens = {
  navy: "#003366",
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
  private: "#5B4B8A",
  members: "#00695C",
  public: "#2E7D32",
  audit: "#6A4A00",
  warning: "#ED6C02",
  error: "#C62828",
};

const members = [
  {
    name: "Member A",
    role: "Board director",
    org: "Financial services organisation",
    standing: "Active",
    consent: "Granted",
    approval: "Public review pending",
    audit: "Profile field updated 14 min ago",
    risk: "Review",
  },
  {
    name: "Member B",
    role: "Founder and executive chair",
    org: "Social impact enterprise",
    standing: "Active",
    consent: "Granted",
    approval: "Approved public-safe",
    audit: "Consent renewed yesterday",
    risk: "Clear",
  },
  {
    name: "Member C",
    role: "University leader",
    org: "Higher education institution",
    standing: "Standing review",
    consent: "Granted",
    approval: "Not eligible for public render",
    audit: "Standing note added today",
    risk: "Attention",
  },
  {
    name: "Member D",
    role: "Technology executive",
    org: "Private sector organisation",
    standing: "Active",
    consent: "Missing",
    approval: "Consent gate closed",
    audit: "Imported record awaiting member confirmation",
    risk: "Blocked",
  },
];

const queue = [
  {
    title: "Public profile approval",
    detail: "Two submitted public-safe biographies require curator approval.",
    status: "Due today",
    tone: "audit",
    icon: ClipboardCheck,
  },
  {
    title: "Standing review",
    detail: "One member access limitation needs administrator follow-up.",
    status: "Action needed",
    tone: "warning",
    icon: FileWarning,
  },
  {
    title: "Consent renewal",
    detail: "Three members have annual notification consent expiring soon.",
    status: "Next 30 days",
    tone: "members",
    icon: ShieldCheck,
  },
];

const auditTrail = [
  "Curator approved public-safe biography projection for Member B.",
  "Administrator updated standing state for Member C with restricted internal note.",
  "Import preview held Member D at consent gate; no live publication permitted.",
  "Governance policy check confirmed admin-only route access.",
];

function Badge({ children, tone = "neutral" }) {
  const palette = {
    active: { color: tokens.public, bg: "rgba(46,125,50,0.10)", border: "rgba(46,125,50,0.28)" },
    consent: { color: tokens.members, bg: "rgba(0,105,92,0.10)", border: "rgba(0,105,92,0.26)" },
    private: { color: tokens.private, bg: "rgba(91,75,138,0.10)", border: "rgba(91,75,138,0.26)" },
    audit: { color: tokens.audit, bg: "rgba(106,74,0,0.10)", border: "rgba(106,74,0,0.25)" },
    warning: { color: tokens.warning, bg: "rgba(237,108,2,0.10)", border: "rgba(237,108,2,0.25)" },
    error: { color: tokens.error, bg: "rgba(198,40,40,0.09)", border: "rgba(198,40,40,0.24)" },
    neutral: { color: tokens.muted, bg: "rgba(77,90,102,0.08)", border: "rgba(77,90,102,0.18)" },
  };
  const p = palette[tone] || palette.neutral;
  return (
    <span
      className="inline-flex min-h-[28px] items-center rounded-md border px-2.5 py-1 text-xs font-semibold"
      style={{ color: p.color, background: p.bg, borderColor: p.border }}
    >
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", icon: Icon, className = "" }) {
  const primary = variant === "primary";
  const danger = variant === "danger";
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
      style={{
        background: primary ? tokens.navy : danger ? tokens.white : tokens.warmPanel,
        color: primary ? tokens.white : danger ? tokens.error : tokens.navy,
        borderColor: primary ? tokens.gold : danger ? "rgba(198,40,40,0.36)" : "rgba(0,51,102,0.18)",
        boxShadow: primary ? "0 10px 20px rgba(0,51,102,0.18)" : "none",
        "--tw-ring-color": tokens.focus,
      }}
    >
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Header() {
  return (
    <header className="border-b" style={{ background: tokens.ink, borderColor: "rgba(212,175,55,0.28)" }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-white p-1" style={{ borderColor: "rgba(212,175,55,0.55)" }}>
            <img src="/legacy-assets/iwfsa-logo.svg" alt="IWFSA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-serif text-xl leading-tight text-white">International Women's Forum South Africa</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>Admin stewardship console</p>
          </div>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-wrap gap-2 text-sm">
          {[
            "Dashboard",
            "Members",
            "Imports",
            "Standing",
            "Review queue",
            "Audit",
          ].map((item) => (
            <a
              key={item}
              href="#"
              className="rounded-md border px-3 py-2 font-semibold text-white/86 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              style={{ borderColor: item === "Members" ? tokens.gold : "rgba(255,255,255,0.18)", background: item === "Members" ? "rgba(212,175,55,0.13)" : "transparent" }}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function StewardshipMetric({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: "rgba(0,51,102,0.10)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: tokens.muted }}> {label}</p>
          <p className="mt-2 font-serif text-3xl" style={{ color: tokens.text }}>{value}</p>
        </div>
        <div className="rounded-md p-2" style={{ color: tokens[tone], background: `${tokens[tone]}18` }}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-sm" style={{ color: tokens.muted }}>{note}</p>
    </div>
  );
}

function MemberRow({ member }) {
  const standingTone = member.standing === "Active" ? "active" : "warning";
  const consentTone = member.consent === "Granted" ? "consent" : "error";
  const approvalTone = member.approval.includes("Approved") ? "active" : member.approval.includes("pending") ? "audit" : "warning";
  return (
    <tr className="border-t align-top" style={{ borderColor: "rgba(0,51,102,0.09)" }}>
      <td className="px-4 py-4">
        <div className="font-semibold" style={{ color: tokens.text }}>{member.name}</div>
        <div className="mt-1 text-sm" style={{ color: tokens.muted }}>{member.role}</div>
        <div className="text-sm" style={{ color: tokens.muted }}>{member.org}</div>
      </td>
      <td className="px-4 py-4"><Badge tone={standingTone}>{member.standing}</Badge></td>
      <td className="px-4 py-4"><Badge tone={consentTone}>{member.consent}</Badge></td>
      <td className="px-4 py-4"><Badge tone={approvalTone}>{member.approval}</Badge></td>
      <td className="px-4 py-4 text-sm" style={{ color: tokens.muted }}>{member.audit}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Review</Button>
          <Button variant="secondary">Edit</Button>
        </div>
      </td>
    </tr>
  );
}

function StatePanel({ kind }) {
  const content = {
    empty: {
      icon: Archive,
      title: "No records match these governance filters",
      body: "Clear the filters or create a temporary member record only when the policy route permits it.",
      badge: "Empty state",
      tone: "audit",
    },
    loading: {
      icon: Clock3,
      title: "Checking member records and audit state",
      body: "The admin table should reserve space with skeleton rows so the interface never jumps or appears blank.",
      badge: "Loading state",
      tone: "members",
    },
    success: {
      icon: CheckCircle2,
      title: "Governance action recorded",
      body: "The change has been saved with an audit label and no public projection was changed without approval.",
      badge: "Success state",
      tone: "active",
    },
    warning: {
      icon: AlertTriangle,
      title: "Restricted stewardship action",
      body: "This action requires active standing, admin role, audit trail, and the mapped admin route before proceeding.",
      badge: "Warning state",
      tone: "warning",
    },
    error: {
      icon: XCircle,
      title: "Unable to complete the admin action",
      body: "The interface should explain the practical next step without exposing sensitive system detail.",
      badge: "Error state",
      tone: "error",
    },
  }[kind];
  const Icon = content.icon;
  return (
    <div className="rounded-lg border p-5" style={{ background: tokens.white, borderColor: "rgba(0,51,102,0.10)" }}>
      <div className="flex items-start gap-3">
        <div className="rounded-md p-2" style={{ color: tokens[content.tone] || tokens.audit, background: `${tokens[content.tone] || tokens.audit}18` }}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <Badge tone={content.tone}>{content.badge}</Badge>
          <h3 className="mt-3 font-serif text-xl" style={{ color: tokens.text }}>{content.title}</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>{content.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function IwfsaAdminMemberGovernancePreview() {
  const [state, setState] = useState("success");
  const filteredMembers = useMemo(() => members, []);

  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 48%, ${tokens.warmBottom} 100%)`, color: tokens.text }}>
      <Header />

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border p-6 shadow-sm md:p-8"
          style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FBF7EF 100%)", borderColor: "rgba(0,51,102,0.12)" }}
        >
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Badge tone="audit">Admin-only governance surface</Badge>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-5xl" style={{ color: tokens.ink }}>
                Member stewardship and governance review
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7" style={{ color: tokens.muted }}>
                A careful administration surface for member records, standing, consent, public approval, and audit traceability. It is intentionally denser than the member workspace, but still calm enough for responsible repeated use.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
              <Button icon={Plus}>Create temporary record</Button>
              <Button variant="secondary" icon={ShieldCheck}>Open policy queue</Button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <StewardshipMetric icon={Users} label="Member records" value="128" note="Temporary records visible only within admin policy." tone="navy" />
        <StewardshipMetric icon={ShieldCheck} label="Consent granted" value="112" note="Consent gates control member and public visibility." tone="members" />
        <StewardshipMetric icon={ClipboardCheck} label="Public review" value="6" note="Curator approval required before public projection." tone="audit" />
        <StewardshipMetric icon={LockKeyhole} label="Restricted" value="3" note="Standing or consent prevents exposed member action." tone="warning" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-12 lg:px-8">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-lg border bg-white shadow-sm" style={{ borderColor: "rgba(0,51,102,0.10)" }}>
            <div className="border-b p-5" style={{ borderColor: "rgba(0,51,102,0.08)" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Administrative member register</h2>
                  <p className="mt-1 text-sm" style={{ color: tokens.muted }}>Review standing, consent, approval and audit signals before changing a record.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative block">
                    <span className="sr-only">Search members</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: tokens.muted }} />
                    <input
                      className="min-h-[44px] w-full rounded-md border bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: "rgba(0,51,102,0.18)", "--tw-ring-color": tokens.focus }}
                      placeholder="Search visible records"
                    />
                  </label>
                  <Button variant="secondary" icon={Filter}>Filters</Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-sm">
                <thead style={{ background: tokens.surface }}>
                  <tr className="text-xs uppercase" style={{ color: tokens.muted }}>
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Standing</th>
                    <th className="px-4 py-3 font-semibold">Consent</th>
                    <th className="px-4 py-3 font-semibold">Approval</th>
                    <th className="px-4 py-3 font-semibold">Latest audit note</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => <MemberRow key={member.name} member={member} />)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border p-5 shadow-sm" style={{ background: tokens.white, borderColor: "rgba(0,51,102,0.10)" }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Interaction states</h2>
                <p className="mt-1 text-sm" style={{ color: tokens.muted }}>The page must remain composed in every operational condition.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["empty", "loading", "success", "warning", "error"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setState(item)}
                    className="min-h-[44px] rounded-md border px-3 text-sm font-semibold capitalize focus:outline-none focus:ring-2"
                    style={{
                      background: state === item ? tokens.navy : tokens.white,
                      color: state === item ? tokens.white : tokens.navy,
                      borderColor: state === item ? tokens.gold : "rgba(0,51,102,0.16)",
                      "--tw-ring-color": tokens.focus,
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <StatePanel kind={state} />
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border p-5 shadow-sm" style={{ background: tokens.white, borderColor: "rgba(0,51,102,0.10)" }}>
            <div className="flex items-center gap-3">
              <div className="rounded-md p-2" style={{ background: "rgba(0,51,102,0.08)", color: tokens.navy }}>
                <UserCog size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Governance queue</h2>
                <p className="text-sm" style={{ color: tokens.muted }}>Priority stewardship work.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {queue.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.title} href="#" className="block rounded-lg border p-4 transition hover:shadow-sm focus:outline-none focus:ring-2" style={{ borderColor: "rgba(0,51,102,0.10)", "--tw-ring-color": tokens.focus }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="rounded-md p-2" style={{ color: tokens[item.tone], background: `${tokens[item.tone]}18` }}>
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: tokens.text }}>{item.title}</h3>
                          <p className="mt-1 text-sm leading-5" style={{ color: tokens.muted }}>{item.detail}</p>
                          <div className="mt-3"><Badge tone={item.tone}>{item.status}</Badge></div>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: tokens.muted }} aria-hidden="true" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-5 shadow-sm" style={{ background: tokens.warmPanel, borderColor: "rgba(106,74,0,0.16)" }}>
            <div className="flex items-center gap-3">
              <div className="rounded-md p-2" style={{ background: "rgba(106,74,0,0.12)", color: tokens.audit }}>
                <ClipboardCheck size={20} aria-hidden="true" />
              </div>
              <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Audit trail preview</h2>
            </div>
            <ol className="mt-5 space-y-4">
              {auditTrail.map((entry, index) => (
                <li key={entry} className="flex gap-3 text-sm leading-6" style={{ color: tokens.muted }}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold" style={{ borderColor: "rgba(106,74,0,0.25)", color: tokens.audit, background: tokens.white }}>
                    {index + 1}
                  </span>
                  <span>{entry}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border p-5 shadow-sm" style={{ background: tokens.white, borderColor: "rgba(198,40,40,0.18)" }}>
            <div className="flex items-start gap-3">
              <div className="rounded-md p-2" style={{ background: "rgba(198,40,40,0.09)", color: tokens.error }}>
                <XCircle size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Delete confirmation</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
                  Destructive controls stay visually restrained and appear after a clear confirmation moment. Public-safe projections and audit records must not be silently removed.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="danger">Confirm delete</Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
