/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Users,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  PencilLine,
  ChevronRight,
  Info,
  Save,
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

const visibilityStyles = {
  private: {
    label: "Private",
    icon: Lock,
    color: tokens.private,
    bg: "rgba(91, 75, 138, 0.09)",
    border: "rgba(91, 75, 138, 0.24)",
    help: "Only you and authorised support can see this field.",
  },
  members: {
    label: "Members only",
    icon: Users,
    color: tokens.members,
    bg: "rgba(0, 105, 92, 0.09)",
    border: "rgba(0, 105, 92, 0.24)",
    help: "Visible inside the protected IWFSA member workspace.",
  },
  public: {
    label: "Public-safe",
    icon: Globe2,
    color: tokens.public,
    bg: "rgba(46, 125, 50, 0.09)",
    border: "rgba(46, 125, 50, 0.24)",
    help: "Eligible for public review after standing and curator approval.",
  },
};

const initialFields = [
  {
    id: "name",
    label: "Preferred display name",
    value: "Member name held privately",
    helper: "Shown according to the visibility choice below.",
    visibility: "members",
  },
  {
    id: "role",
    label: "Leadership role",
    value: "Board Chair, public-sector governance",
    helper: "Use a professional role description rather than sensitive detail.",
    visibility: "public",
  },
  {
    id: "organisation",
    label: "Organisation",
    value: "Organisation visible to members",
    helper: "This can remain member-only where consent is limited.",
    visibility: "members",
  },
  {
    id: "bio",
    label: "Biographical note",
    value:
      "A concise leadership profile focused on contribution, stewardship, and civic service.",
    helper: "Public-safe biographies should avoid private contact or family information.",
    visibility: "public",
  },
  {
    id: "mobile",
    label: "Mobile number",
    value: "Hidden private contact detail",
    helper: "Contact details remain protected unless a specific member workflow allows sharing.",
    visibility: "private",
  },
];

function Header() {
  const nav = ["Dashboard", "Profile", "Events", "Directory", "Notifications"];
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07131D] text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded border border-[#D4AF37]/55 bg-white p-1 shadow-sm">
            <img
              src="/legacy-assets/iwfsa-logo.svg"
              alt="IWFSA logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-serif text-lg leading-tight text-white md:text-xl">
              International Women&apos;s Forum South Africa
            </p>
            <p className="mt-1 text-sm text-white/72">Member workspace - Profile</p>
          </div>
        </div>
        <nav aria-label="Member navigation" className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
          {nav.map((item) => (
            <a
              key={item}
              href="#"
              className={`min-h-11 whitespace-nowrap rounded px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 focus:ring-offset-[#07131D] ${
                item === "Profile"
                  ? "bg-[#D4AF37] text-[#07131D] shadow-sm"
                  : "text-white/82 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function VisibilityBadge({ visibility }) {
  const style = visibilityStyles[visibility];
  const Icon = style.icon;
  return (
    <span
      className="inline-flex min-h-8 items-center gap-2 rounded border px-2.5 py-1 text-sm font-medium"
      style={{ color: style.color, borderColor: style.border, background: style.bg }}
    >
      <Icon size={15} aria-hidden="true" />
      {style.label}
    </span>
  );
}

function StatusMessage({ type }) {
  const map = {
    success: {
      icon: CheckCircle2,
      title: "Profile preferences saved",
      text: "Your visibility choices have been recorded. Public-safe fields still require standing and curator approval before appearing publicly.",
      color: tokens.public,
      bg: "rgba(46, 125, 50, 0.09)",
      border: "rgba(46, 125, 50, 0.22)",
    },
    warning: {
      icon: AlertTriangle,
      title: "Public review still required",
      text: "Public-safe fields are prepared for review, but they are not published from this member page.",
      color: tokens.warning,
      bg: "rgba(237, 108, 2, 0.08)",
      border: "rgba(237, 108, 2, 0.24)",
    },
    error: {
      icon: AlertTriangle,
      title: "Changes could not be saved",
      text: "Please review the highlighted field and try again. No private profile information has been published.",
      color: tokens.error,
      bg: "rgba(198, 40, 40, 0.08)",
      border: "rgba(198, 40, 40, 0.24)",
    },
  };
  const current = map[type];
  const Icon = current.icon;
  return (
    <div
      className="rounded border p-4"
      style={{ background: current.bg, borderColor: current.border }}
      role={type === "error" ? "alert" : "status"}
    >
      <div className="flex gap-3">
        <Icon size={21} style={{ color: current.color }} aria-hidden="true" />
        <div>
          <h3 className="font-serif text-xl" style={{ color: tokens.text }}>{current.title}</h3>
          <p className="mt-1 text-sm leading-6" style={{ color: tokens.muted }}>{current.text}</p>
        </div>
      </div>
    </div>
  );
}

function FieldControl({ field, onChangeVisibility }) {
  const style = visibilityStyles[field.visibility];
  return (
    <article className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <label className="block text-sm font-semibold" style={{ color: tokens.text }}>
            {field.label}
          </label>
          <p className="mt-1 text-sm leading-6" style={{ color: tokens.muted }}>{field.helper}</p>
          <div className="mt-3 min-h-11 rounded border bg-[#F8F9FA] px-3 py-3 text-[15px] leading-6" style={{ borderColor: "rgba(7,19,29,0.10)", color: tokens.text }}>
            {field.value}
          </div>
        </div>
        <div className="w-full shrink-0 lg:w-56">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.muted }}>
            Visibility
          </p>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={`${field.label} visibility`}>
            {Object.entries(visibilityStyles).map(([key, option]) => {
              const Icon = option.icon;
              const active = field.visibility === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChangeVisibility(field.id, key)}
                  className="min-h-11 rounded border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2"
                  style={{
                    borderColor: active ? option.color : "rgba(7,19,29,0.12)",
                    background: active ? option.bg : tokens.white,
                    color: active ? option.color : tokens.text,
                  }}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon size={15} aria-hidden="true" />
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-5" style={{ color: style.color }}>{style.help}</p>
        </div>
      </div>
    </article>
  );
}

function PublicPreview({ fields }) {
  const publicFields = fields.filter((field) => field.visibility === "public");
  return (
    <section className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.audit }}>
            Preview only
          </p>
          <h2 className="mt-1 font-serif text-2xl" style={{ color: tokens.text }}>Public-safe projection</h2>
        </div>
        <VisibilityBadge visibility="public" />
      </div>
      <div className="mt-5 rounded bg-[#FBF7EF] p-4" style={{ border: "1px solid rgba(212,175,55,0.28)" }}>
        {publicFields.length === 0 ? (
          <div className="py-5 text-center">
            <Eye className="mx-auto mb-3" style={{ color: tokens.muted }} />
            <p className="font-serif text-xl" style={{ color: tokens.text }}>No public-safe fields selected</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: tokens.muted }}>
              Choose Public-safe on a field to prepare it for review. Nothing is published automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicFields.map((field) => (
              <div key={field.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.muted }}>{field.label}</p>
                <p className="mt-1 text-sm leading-6" style={{ color: tokens.text }}>{field.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-3 rounded border p-3" style={{ borderColor: "rgba(106,74,0,0.22)", background: "rgba(106,74,0,0.06)" }}>
        <Info size={18} style={{ color: tokens.audit }} aria-hidden="true" />
        <p className="text-sm leading-6" style={{ color: tokens.muted }}>
          Public-safe content appears publicly only when standing is good, consent is granted, and a curator approves the projection.
        </p>
      </div>
    </section>
  );
}

function ProfileSummary({ mode, setMode }) {
  const states = [
    { key: "ready", label: "Ready", icon: ShieldCheck, text: "Consent granted" },
    { key: "loading", label: "Loading", icon: Loader2, text: "Retrieving profile" },
    { key: "success", label: "Success", icon: CheckCircle2, text: "Saved" },
    { key: "warning", label: "Warning", icon: AlertTriangle, text: "Review needed" },
    { key: "error", label: "Error", icon: AlertTriangle, text: "Save issue" },
  ];
  return (
    <section className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
      <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Profile stewardship</h2>
      <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
        Review the page states without changing the primary task: control what is visible and to whom.
      </p>
      <div className="mt-5 grid gap-2">
        {states.map((item) => {
          const Icon = item.icon;
          const active = mode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className="min-h-11 rounded border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2"
              style={{
                borderColor: active ? tokens.gold : "rgba(7,19,29,0.12)",
                background: active ? tokens.warmPanel : tokens.white,
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium" style={{ color: tokens.text }}>
                  <Icon size={16} className={item.key === "loading" ? "animate-spin" : ""} aria-hidden="true" />
                  {item.label}
                </span>
                <span className="text-xs" style={{ color: tokens.muted }}>{item.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LoadingProfile() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded border bg-white p-5" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-11 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function IwfsaMemberProfilePreview() {
  const [fields, setFields] = useState(initialFields);
  const [mode, setMode] = useState("ready");

  const counts = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        acc[field.visibility] += 1;
        return acc;
      },
      { private: 0, members: 0, public: 0 }
    );
  }, [fields]);

  function changeVisibility(id, visibility) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, visibility } : field)));
    if (mode !== "error") setMode("warning");
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 48%, ${tokens.warmBottom} 100%)`, color: tokens.text }}>
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded border shadow-[0_18px_50px_rgba(7,19,29,0.12)]"
          style={{ borderColor: "rgba(7,19,29,0.10)", background: tokens.ink }}
        >
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="p-6 md:p-8 lg:col-span-8">
              <div className="inline-flex min-h-8 items-center gap-2 rounded border border-[#D4AF37]/35 bg-white/8 px-3 py-1 text-sm text-white/84">
                <ShieldCheck size={15} aria-hidden="true" />
                Consent granted - Member-controlled profile
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-white md:text-5xl">
                Profile visibility control
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/76 md:text-lg">
                Review how your identity is represented inside the member workspace, and prepare only approved, public-safe material for later publication review.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setMode("success")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#D4AF37] bg-[#003366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#082f57] focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 focus:ring-offset-[#07131D]"
                >
                  <Save size={17} aria-hidden="true" />
                  Save visibility choices
                </button>
                <a
                  href="#preview"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/22 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16 focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 focus:ring-offset-[#07131D]"
                >
                  Review public-safe preview
                  <ChevronRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
            <aside className="border-t border-white/10 bg-white/[0.06] p-6 md:p-8 lg:col-span-4 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded border border-[#D4AF37]/40 bg-[#FBF7EF] font-serif text-3xl text-[#003366]">
                  I
                </div>
                <div>
                  <p className="font-serif text-2xl text-white">Member profile</p>
                  <p className="mt-1 text-sm text-white/68">Protected identity workspace</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded bg-white/8 p-3">
                  <VisibilityBadge visibility="private" />
                  <span className="text-sm font-semibold text-white">{counts.private}</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/8 p-3">
                  <VisibilityBadge visibility="members" />
                  <span className="text-sm font-semibold text-white">{counts.members}</span>
                </div>
                <div className="flex items-center justify-between rounded bg-white/8 p-3">
                  <VisibilityBadge visibility="public" />
                  <span className="text-sm font-semibold text-white">{counts.public}</span>
                </div>
              </div>
            </aside>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {mode === "success" && <StatusMessage type="success" />}
            {mode === "warning" && <StatusMessage type="warning" />}
            {mode === "error" && <StatusMessage type="error" />}

            <section className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: tokens.muted }}>Primary task</p>
                  <h2 className="mt-1 font-serif text-3xl" style={{ color: tokens.text }}>Control each profile field</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: tokens.muted }}>
                    Each field carries its own visibility signal. The member can distinguish private information, protected member-only material, and public-safe content before saving.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded border bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#FBF7EF] focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2"
                  style={{ color: tokens.navy, borderColor: "rgba(0,51,102,0.22)" }}
                >
                  <PencilLine size={17} aria-hidden="true" />
                  Edit profile text
                </button>
              </div>
            </section>

            {mode === "loading" ? (
              <LoadingProfile />
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <FieldControl key={field.id} field={field} onChangeVisibility={changeVisibility} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <ProfileSummary mode={mode} setMode={setMode} />

            <section className="rounded border p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ background: tokens.warmPanel, borderColor: "rgba(212,175,55,0.30)" }}>
              <div className="flex items-start gap-3">
                <ShieldCheck size={22} style={{ color: tokens.navy }} aria-hidden="true" />
                <div>
                  <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Public visibility review</h2>
                  <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
                    Your profile will only appear publicly when your standing is good and a curator approves it. You retain full control and can withdraw visibility at any time.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
              <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Confirmation summary</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(counts).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded border p-3" style={{ borderColor: visibilityStyles[key].border, background: visibilityStyles[key].bg }}>
                    <VisibilityBadge visibility={key} />
                    <span className="font-semibold" style={{ color: visibilityStyles[key].color }}>{value} fields</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section id="preview" className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <PublicPreview fields={fields} />
          </div>
          <div className="lg:col-span-4">
            <section className="rounded border bg-white p-5 shadow-[0_10px_30px_rgba(7,19,29,0.06)]" style={{ borderColor: "rgba(7,19,29,0.10)" }}>
              <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Empty-state treatment</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
                If no profile fields exist yet, this area becomes a warm panel with one action: add profile information. It should never show a blank or alarming state.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded border border-[#D4AF37] bg-[#003366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#082f57] focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2"
              >
                Add profile information
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
