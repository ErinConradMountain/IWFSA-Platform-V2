/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Clock, Edit3, FileWarning, Filter, Plus, Search, ShieldCheck, Trash2, UsersRound, X } from "lucide-react";

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
  deepInk: "#07131D",
  adminAudit: "#6A4A00",
  warning: "#ED6C02",
  error: "#C62828",
  success: "#2E7D32",
  members: "#00695C",
};

const events = [
  {
    id: "evt-001",
    title: "Leadership Roundtable: Stewardship in a Changing Economy",
    lifecycle: "Published",
    date: "18 June 2026",
    time: "17:30-20:00",
    location: "Johannesburg",
    capacity: 80,
    registered: 64,
    waitlist: 3,
    updated: "Updated today by Admin Team",
    audit: "Audit trail active",
  },
  {
    id: "evt-002",
    title: "Member Dialogue: Intergenerational Influence",
    lifecycle: "Draft",
    date: "24 July 2026",
    time: "16:00-18:00",
    location: "Cape Town",
    capacity: 45,
    registered: 0,
    waitlist: 0,
    updated: "Draft saved 2 days ago",
    audit: "Not visible to members",
  },
  {
    id: "evt-003",
    title: "Annual Fellowship Dinner",
    lifecycle: "Review",
    date: "12 September 2026",
    time: "18:30-22:00",
    location: "Pretoria",
    capacity: 120,
    registered: 108,
    waitlist: 9,
    updated: "Capacity reviewed yesterday",
    audit: "Publication review required",
  },
];

const lifecycleStyles = {
  Published: { color: tokens.success, bg: "rgba(46,125,50,0.09)", border: "rgba(46,125,50,0.25)" },
  Draft: { color: tokens.muted, bg: "rgba(77,90,102,0.09)", border: "rgba(77,90,102,0.22)" },
  Review: { color: tokens.adminAudit, bg: "rgba(106,74,0,0.1)", border: "rgba(106,74,0,0.25)" },
};

function Badge({ children, tone = "neutral" }) {
  const palette = {
    neutral: { color: tokens.muted, bg: "rgba(77,90,102,0.08)", border: "rgba(77,90,102,0.18)" },
    audit: { color: tokens.adminAudit, bg: "rgba(106,74,0,0.1)", border: "rgba(106,74,0,0.25)" },
    warning: { color: tokens.warning, bg: "rgba(237,108,2,0.09)", border: "rgba(237,108,2,0.22)" },
    success: { color: tokens.success, bg: "rgba(46,125,50,0.09)", border: "rgba(46,125,50,0.22)" },
    members: { color: tokens.members, bg: "rgba(0,105,92,0.09)", border: "rgba(0,105,92,0.22)" },
  }[tone];
  return (
    <span
      className="inline-flex min-h-[28px] items-center rounded-[6px] border px-2.5 py-1 text-xs font-semibold"
      style={{ color: palette.color, backgroundColor: palette.bg, borderColor: palette.border }}
    >
      {children}
    </span>
  );
}

function LifecycleBadge({ status }) {
  const style = lifecycleStyles[status] ?? lifecycleStyles.Draft;
  return (
    <span
      className="inline-flex min-h-[28px] items-center rounded-[6px] border px-2.5 py-1 text-xs font-semibold"
      style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
    >
      {status}
    </span>
  );
}

function AdminHeader() {
  const nav = ["Stewardship", "Members", "Imports", "Standing", "Events", "Audit"];
  return (
    <header className="border-b" style={{ backgroundColor: tokens.deepInk, borderColor: "rgba(212,175,55,0.25)" }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[6px] border bg-white p-2" style={{ borderColor: "rgba(212,175,55,0.45)" }}>
            <img src="/legacy-assets/iwfsa-logo.svg" alt="IWFSA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-serif text-xl leading-tight text-white">International Women's Forum South Africa</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>Admin stewardship console</p>
          </div>
        </div>
        <nav aria-label="Admin workspace navigation" className="flex flex-wrap gap-2">
          {nav.map((item) => (
            <button
              key={item}
              className="min-h-[44px] rounded-[6px] border px-3 text-sm font-semibold transition"
              style={{
                color: item === "Events" ? tokens.deepInk : "rgba(255,255,255,0.86)",
                backgroundColor: item === "Events" ? tokens.gold : "rgba(255,255,255,0.06)",
                borderColor: item === "Events" ? tokens.gold : "rgba(255,255,255,0.13)",
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function EventRow({ event, onDelete }) {
  const utilisation = Math.round((event.registered / event.capacity) * 100);
  return (
    <article className="grid gap-4 border-b px-5 py-5 lg:grid-cols-12 lg:items-center" style={{ borderColor: "rgba(0,51,102,0.1)" }}>
      <div className="lg:col-span-4">
        <div className="flex flex-wrap items-center gap-2">
          <LifecycleBadge status={event.lifecycle} />
          <Badge tone="audit">{event.audit}</Badge>
        </div>
        <h2 className="mt-3 font-serif text-[22px] leading-tight" style={{ color: tokens.text }}>{event.title}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm" style={{ color: tokens.muted }}>
          <CalendarDays size={16} aria-hidden="true" /> {event.date} - {event.time} - {event.location}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:col-span-3">
        <div className="rounded-[6px] border bg-white p-3" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
          <p className="text-xs font-semibold uppercase" style={{ color: tokens.muted }}>Capacity</p>
          <p className="mt-1 text-lg font-bold" style={{ color: tokens.navy }}>{event.capacity}</p>
        </div>
        <div className="rounded-[6px] border bg-white p-3" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
          <p className="text-xs font-semibold uppercase" style={{ color: tokens.muted }}>RSVPs</p>
          <p className="mt-1 text-lg font-bold" style={{ color: tokens.navy }}>{event.registered}</p>
        </div>
        <div className="rounded-[6px] border bg-white p-3" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
          <p className="text-xs font-semibold uppercase" style={{ color: tokens.muted }}>Waitlist</p>
          <p className="mt-1 text-lg font-bold" style={{ color: event.waitlist > 0 ? tokens.warning : tokens.navy }}>{event.waitlist}</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,51,102,0.12)" }} aria-label={`Capacity utilisation ${utilisation}%`}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(utilisation, 100)}%`, backgroundColor: utilisation > 90 ? tokens.warning : tokens.navy }} />
        </div>
        <p className="mt-2 text-sm" style={{ color: tokens.muted }}>{utilisation}% allocated</p>
        <p className="mt-1 text-xs" style={{ color: tokens.muted }}>{event.updated}</p>
      </div>

      <div className="flex flex-wrap gap-2 lg:col-span-3 lg:justify-end">
        <button className="min-h-[44px] rounded-[6px] border px-3 text-sm font-semibold" style={{ color: tokens.navy, backgroundColor: tokens.white, borderColor: "rgba(0,51,102,0.28)" }}>
          <Edit3 size={15} className="mr-2 inline" aria-hidden="true" /> Edit
        </button>
        <button className="min-h-[44px] rounded-[6px] border px-3 text-sm font-semibold" style={{ color: tokens.adminAudit, backgroundColor: tokens.warmPanel, borderColor: "rgba(106,74,0,0.28)" }}>
          <Clock size={15} className="mr-2 inline" aria-hidden="true" /> Lifecycle
        </button>
        <button onClick={() => onDelete(event)} className="min-h-[44px] rounded-[6px] border px-3 text-sm font-semibold" style={{ color: tokens.error, backgroundColor: tokens.white, borderColor: "rgba(198,40,40,0.32)" }}>
          <Trash2 size={15} className="mr-2 inline" aria-hidden="true" /> Delete
        </button>
      </div>
    </article>
  );
}

function StatePanel({ state }) {
  const copy = {
    empty: {
      icon: ClipboardCheck,
      title: "No temporary event records yet",
      body: "Create the first event record when event details are ready for stewarded review.",
      tone: tokens.navy,
      action: "Create event",
    },
    loading: {
      icon: Clock,
      title: "Loading event records",
      body: "The admin console is preparing event data and audit-aware status information.",
      tone: tokens.adminAudit,
      action: "Please wait",
    },
    success: {
      icon: ShieldCheck,
      title: "Event record saved",
      body: "The change has been recorded with audit trail active. Member visibility follows lifecycle state.",
      tone: tokens.success,
      action: "Review record",
    },
    warning: {
      icon: FileWarning,
      title: "Publication review required",
      body: "This event has RSVP pressure or incomplete publication checks. Review before changing lifecycle state.",
      tone: tokens.warning,
      action: "Open review",
    },
    error: {
      icon: X,
      title: "Event change could not be completed",
      body: "Check required fields and try again. No member-facing change has been published.",
      tone: tokens.error,
      action: "Return to form",
    },
  }[state];
  const Icon = copy.icon;
  return (
    <section className="rounded-[8px] border p-5" style={{ backgroundColor: tokens.white, borderColor: "rgba(0,51,102,0.12)", boxShadow: "0 18px 50px rgba(7,19,29,0.08)" }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]" style={{ backgroundColor: `${copy.tone}18`, color: copy.tone }}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-serif text-2xl" style={{ color: tokens.text }}>{copy.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: tokens.muted }}>{copy.body}</p>
          </div>
        </div>
        <button className="min-h-[44px] rounded-[6px] border px-4 text-sm font-semibold" style={{ color: tokens.navy, backgroundColor: tokens.warmPanel, borderColor: "rgba(0,51,102,0.22)" }}>
          {copy.action}
        </button>
      </div>
    </section>
  );
}

function DeleteDialog({ event, onClose }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="w-full max-w-lg rounded-[8px] border bg-white p-6 shadow-2xl" style={{ borderColor: "rgba(198,40,40,0.24)" }}>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[6px]" style={{ backgroundColor: "rgba(198,40,40,0.08)", color: tokens.error }}>
            <Trash2 size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 id="delete-title" className="font-serif text-2xl" style={{ color: tokens.text }}>Confirm restrained deletion</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>
              Delete <strong>{event.title}</strong> only if this temporary event record is no longer needed. This action should produce an audit note and must not expose private member details.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="min-h-[44px] rounded-[6px] border px-4 text-sm font-semibold" style={{ color: tokens.navy, backgroundColor: tokens.white, borderColor: "rgba(0,51,102,0.26)" }}>Cancel</button>
          <button onClick={onClose} className="min-h-[44px] rounded-[6px] border px-4 text-sm font-semibold" style={{ color: tokens.error, backgroundColor: "rgba(198,40,40,0.06)", borderColor: "rgba(198,40,40,0.42)" }}>Delete temporary record</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPreview() {
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("success");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => [event.title, event.lifecycle, event.location].join(" ").toLowerCase().includes(q));
  }, [query]);

  const totals = {
    records: events.length,
    published: events.filter((e) => e.lifecycle === "Published").length,
    waitlist: events.reduce((sum, e) => sum + e.waitlist, 0),
    capacity: events.reduce((sum, e) => sum + e.capacity, 0),
  };

  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 42%, ${tokens.warmBottom} 100%)`, color: tokens.text }}>
      <AdminHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold uppercase" style={{ color: tokens.adminAudit }}>Admin events - audit-aware management</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl" style={{ color: tokens.deepInk }}>Steward event records safely.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7" style={{ color: tokens.muted }}>
              Create, review, update, and retire event records with lifecycle clarity. Member-facing RSVP controls stay outside this admin surface.
            </p>
          </div>
          <div className="lg:col-span-4 lg:self-end">
            <button
              data-primary-action="create-event"
              className="flex min-h-[48px] w-full items-center justify-center rounded-[6px] border px-5 text-sm font-bold shadow-sm"
              style={{ color: tokens.white, backgroundColor: tokens.navy, borderColor: tokens.gold }}
            >
              <Plus size={18} className="mr-2" aria-hidden="true" /> Create event
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4" aria-label="Admin event summary">
          {[
            ["Temporary records", totals.records, ClipboardCheck],
            ["Published", totals.published, ShieldCheck],
            ["Waitlisted members", totals.waitlist, UsersRound],
            ["Total capacity", totals.capacity, CalendarDays],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-[8px] border bg-white p-4" style={{ borderColor: "rgba(0,51,102,0.12)", boxShadow: "0 14px 34px rgba(7,19,29,0.06)" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{ color: tokens.muted }}>{label}</p>
                <Icon size={18} style={{ color: tokens.adminAudit }} aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold" style={{ color: tokens.navy }}>{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[8px] border bg-white p-5" style={{ borderColor: "rgba(0,51,102,0.12)", boxShadow: "0 18px 50px rgba(7,19,29,0.08)" }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-serif text-3xl" style={{ color: tokens.text }}>Event stewardship list</h2>
              <p className="mt-2 text-sm" style={{ color: tokens.muted }}>Operational view with lifecycle, capacity, RSVP pressure, and audit-aware metadata.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="block min-w-[260px]">
                <span className="mb-1 block text-sm font-semibold" style={{ color: tokens.text }}>Search events</span>
                <span className="flex min-h-[44px] items-center rounded-[6px] border bg-white px-3" style={{ borderColor: "rgba(0,51,102,0.22)" }}>
                  <Search size={17} style={{ color: tokens.muted }} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="ml-2 h-10 w-full bg-transparent text-sm outline-none"
                    placeholder="Title, location, lifecycle"
                    aria-label="Search events by title, location, or lifecycle"
                  />
                </span>
              </label>
              <label className="block min-w-[210px]">
                <span className="mb-1 block text-sm font-semibold" style={{ color: tokens.text }}>Preview state</span>
                <span className="flex min-h-[44px] items-center rounded-[6px] border bg-white px-3" style={{ borderColor: "rgba(0,51,102,0.22)" }}>
                  <Filter size={17} style={{ color: tokens.muted }} aria-hidden="true" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="ml-2 h-10 w-full bg-transparent text-sm outline-none"
                    aria-label="Choose interaction state preview"
                  >
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="loading">Loading</option>
                    <option value="empty">Empty</option>
                  </select>
                </span>
              </label>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <StatePanel state={selectedState} />
        </div>

        <section className="mt-6 overflow-hidden rounded-[8px] border bg-white" style={{ borderColor: "rgba(0,51,102,0.12)", boxShadow: "0 18px 50px rgba(7,19,29,0.08)" }}>
          <div className="border-b px-5 py-4" style={{ backgroundColor: tokens.soft, borderColor: "rgba(0,51,102,0.1)" }}>
            <div className="grid gap-2 text-xs font-semibold uppercase lg:grid-cols-12" style={{ color: tokens.muted }}>
              <span className="lg:col-span-4">Event and lifecycle</span>
              <span className="lg:col-span-3">Capacity controls</span>
              <span className="lg:col-span-2">Operational pressure</span>
              <span className="lg:col-span-3 lg:text-right">Admin actions</span>
            </div>
          </div>

          {selectedState === "loading" ? (
            <div className="space-y-4 p-5" aria-live="polite">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-[6px]" style={{ backgroundColor: "rgba(0,51,102,0.08)" }} />
              ))}
            </div>
          ) : selectedState === "empty" || filteredEvents.length === 0 ? (
            <div className="p-5">
              <StatePanel state="empty" />
            </div>
          ) : (
            filteredEvents.map((event) => <EventRow key={event.id} event={event} onDelete={setDeleteTarget} />)
          )}
        </section>

        <section className="mt-6 rounded-[8px] border p-5" style={{ backgroundColor: tokens.warmPanel, borderColor: "rgba(106,74,0,0.2)" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-serif text-2xl" style={{ color: tokens.text }}>Governance note</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: tokens.muted }}>
                This admin surface supports creation, editing, deletion, lifecycle review, capacity oversight, and audit awareness. It does not render member RSVP controls or member self-service language.
              </p>
            </div>
            <Badge tone="audit">Admin-only surface</Badge>
          </div>
        </section>
      </section>

      <DeleteDialog event={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </main>
  );
}
