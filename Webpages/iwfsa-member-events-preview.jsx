/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, MapPin, ShieldCheck, Users, AlertTriangle, Search, Loader2, XCircle, ChevronRight, Bell } from "lucide-react";

const events = [
  {
    id: "leadership-salon",
    title: "Leadership Salon: Stewardship in a Changing Public Life",
    status: "Published",
    rsvpState: "open",
    date: "Thursday, 18 June 2026",
    time: "17:30-19:30",
    location: "Johannesburg - Members' lounge",
    capacity: 48,
    registered: 31,
    waitlist: 0,
    type: "Leadership dialogue",
    note: "A reflective evening for senior members to exchange practice, courage, and context.",
  },
  {
    id: "mentorship-roundtable",
    title: "Intergenerational Mentorship Roundtable",
    status: "Published",
    rsvpState: "waitlist",
    date: "Saturday, 27 June 2026",
    time: "10:00-12:00",
    location: "Cape Town - Partner venue",
    capacity: 24,
    registered: 24,
    waitlist: 6,
    type: "Member development",
    note: "A small-format exchange pairing established and emerging leaders across sectors.",
  },
  {
    id: "annual-assembly",
    title: "Annual Member Assembly and Governance Briefing",
    status: "Published",
    rsvpState: "confirmed",
    date: "Wednesday, 15 July 2026",
    time: "16:00-18:00",
    location: "Hybrid - Pretoria and online",
    capacity: 120,
    registered: 84,
    waitlist: 0,
    type: "Forum governance",
    note: "A clear annual briefing on forum priorities, member participation, and stewardship.",
  },
];

const filterOptions = ["All events", "Open RSVP", "Waitlist", "My RSVP"];

function LogoMark() {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-14 w-14 shrink-0 rounded-sm border border-[#D4AF37]/60 bg-white p-1 shadow-sm">
        <img src="/legacy-assets/iwfsa-logo.svg" alt="IWFSA logo" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <p className="font-serif text-[18px] leading-tight text-white md:text-[21px]">International Women&apos;s Forum South Africa</p>
        <p className="mt-1 text-sm text-white/72">Member workspace - Events</p>
      </div>
    </div>
  );
}

function NavItem({ active, children }) {
  return (
    <button
      className={`min-h-11 rounded-full px-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#005FCC] focus:ring-offset-2 focus:ring-offset-[#07131D] ${
        active ? "bg-[#D4AF37] text-[#07131D] shadow-sm" : "text-white/82 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ tone = "neutral", children }) {
  const tones = {
    neutral: "border-[#D9D5CC] bg-white text-[#4D5A66]",
    published: "border-[#00695C]/20 bg-[#00695C]/8 text-[#00695C]",
    success: "border-[#2E7D32]/24 bg-[#2E7D32]/8 text-[#2E7D32]",
    waitlist: "border-[#ED6C02]/25 bg-[#ED6C02]/10 text-[#8A4200]",
    private: "border-[#5B4B8A]/24 bg-[#5B4B8A]/8 text-[#5B4B8A]",
  };
  return <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function CapacityBar({ registered, capacity }) {
  const pct = Math.min(100, Math.round((registered / capacity) * 100));
  return (
    <div aria-label={`${registered} of ${capacity} places registered`}>
      <div className="mb-2 flex items-center justify-between text-xs text-[#4D5A66]">
        <span>{registered} registered</span>
        <span>{capacity} places</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E7E1D5]">
        <div className="h-full rounded-full bg-[#003366]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RSVPButton({ state, onClick }) {
  if (state === "confirmed") {
    return (
      <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2E7D32]/25 bg-[#2E7D32]/8 px-4 text-sm font-semibold text-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#005FCC] md:w-auto">
        <CheckCircle2 className="h-4 w-4" /> RSVP confirmed
      </button>
    );
  }
  if (state === "waitlist") {
    return (
      <button onClick={onClick} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#D4AF37] bg-[#FBF7EF] px-4 text-sm font-semibold text-[#003366] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#005FCC] md:w-auto">
        Join waitlist <ChevronRight className="h-4 w-4" />
      </button>
    );
  }
  return (
    <button onClick={onClick} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#D4AF37] bg-[#003366] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D1824] focus:outline-none focus:ring-2 focus:ring-[#005FCC] md:w-auto">
      RSVP now <ChevronRight className="h-4 w-4" />
    </button>
  );
}

function EventCard({ event, onRSVP }) {
  const isWaitlist = event.rsvpState === "waitlist";
  const confirmed = event.rsvpState === "confirmed";
  return (
    <article className="flex h-full flex-col rounded-lg border border-[#DDD6C8] bg-white p-5 shadow-[0_16px_34px_rgba(7,19,29,0.07)]">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="published">{event.status}</Chip>
        {confirmed ? <Chip tone="success">Your place is confirmed</Chip> : isWaitlist ? <Chip tone="waitlist">Waitlist available</Chip> : <Chip tone="neutral">RSVP open</Chip>}
      </div>

      <div className="mt-5 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6A4A00]">{event.type}</p>
        <h3 className="mt-2 font-serif text-[24px] leading-tight text-[#07131D]">{event.title}</h3>
        <p className="mt-3 text-[15px] leading-6 text-[#4D5A66]">{event.note}</p>

        <dl className="mt-5 grid gap-3 text-sm text-[#1A1A1A]">
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#003366]" />
            <div><dt className="sr-only">Date</dt><dd>{event.date}</dd></div>
          </div>
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#003366]" />
            <div><dt className="sr-only">Time</dt><dd>{event.time}</dd></div>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#003366]" />
            <div><dt className="sr-only">Location</dt><dd>{event.location}</dd></div>
          </div>
        </dl>

        <div className="mt-5 rounded-md border border-[#E5DED2] bg-[#FBF7EF] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#07131D]"><Users className="h-4 w-4 text-[#003366]" /> Capacity</span>
            <span className="text-xs text-[#4D5A66]">{event.waitlist} waiting</span>
          </div>
          <CapacityBar registered={event.registered} capacity={event.capacity} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[#EFE8DC] pt-5 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-5 text-[#4D5A66]">Members only - no public publication implied</p>
        <RSVPButton state={event.rsvpState} onClick={() => onRSVP(event)} />
      </div>
    </article>
  );
}

function StatePanel({ type }) {
  const states = {
    success: {
      icon: CheckCircle2,
      title: "RSVP confirmed",
      copy: "Your place has been reserved. A confirmation notice has been added to your member notifications.",
      className: "border-[#2E7D32]/25 bg-[#2E7D32]/8 text-[#1A1A1A]",
      iconClass: "text-[#2E7D32]",
    },
    waitlist: {
      icon: AlertTriangle,
      title: "Waitlist joined",
      copy: "This event is currently full. You have been added to the waitlist and will be notified if a place becomes available.",
      className: "border-[#ED6C02]/25 bg-[#ED6C02]/10 text-[#1A1A1A]",
      iconClass: "text-[#ED6C02]",
    },
    error: {
      icon: XCircle,
      title: "RSVP could not be completed",
      copy: "Please try again. No private technical details are shown here, and your existing event status has not changed.",
      className: "border-[#C62828]/25 bg-[#C62828]/8 text-[#1A1A1A]",
      iconClass: "text-[#C62828]",
    },
  };
  const item = states[type];
  const Icon = item.icon;
  return (
    <div className={`rounded-lg border p-4 ${item.className}`} role={type === "error" ? "alert" : "status"}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.iconClass}`} />
        <div>
          <h2 className="font-serif text-xl text-[#07131D]">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#4D5A66]">{item.copy}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-[#DDD6C8] bg-[#FBF7EF] p-8 text-center shadow-[0_16px_34px_rgba(7,19,29,0.05)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/45 bg-white">
        <CalendarDays className="h-6 w-6 text-[#003366]" />
      </div>
      <h2 className="mt-4 font-serif text-2xl text-[#07131D]">No visible member events</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#4D5A66]">There are no published member events matching this view. When new events are made available to members, they will appear here.</p>
      <button className="mt-5 min-h-11 rounded-md border border-[#D4AF37] bg-white px-5 text-sm font-semibold text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Return to all events</button>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="grid gap-5 lg:grid-cols-3" aria-label="Loading events">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-[#DDD6C8] bg-white p-5 shadow-[0_16px_34px_rgba(7,19,29,0.05)]">
          <div className="flex items-center gap-2 text-sm text-[#4D5A66]"><Loader2 className="h-4 w-4 animate-spin" /> Loading event</div>
          <div className="mt-5 h-6 w-2/3 rounded bg-[#EFE8DC]" />
          <div className="mt-4 h-4 w-full rounded bg-[#EFE8DC]" />
          <div className="mt-2 h-4 w-5/6 rounded bg-[#EFE8DC]" />
          <div className="mt-6 h-28 rounded bg-[#F7F3EC]" />
        </div>
      ))}
    </section>
  );
}

export default function MemberEventsPreview() {
  const [filter, setFilter] = useState("All events");
  const [query, setQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("success");
  const [showDemoState, setShowDemoState] = useState("cards");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesQuery = `${event.title} ${event.type} ${event.location}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "All events" ||
        (filter === "Open RSVP" && event.rsvpState === "open") ||
        (filter === "Waitlist" && event.rsvpState === "waitlist") ||
        (filter === "My RSVP" && event.rsvpState === "confirmed");
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  function handleRSVP(event) {
    setStatusMessage(event.rsvpState === "waitlist" ? "waitlist" : "success");
    setShowDemoState("cards");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7F3EC] via-[#F2EFE8] to-[#EDE9E2] text-[#1A1A1A]">
      <header className="border-b border-white/10 bg-[#07131D]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <LogoMark />
          <nav aria-label="Member navigation" className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <NavItem>Dashboard</NavItem>
            <NavItem>Profile</NavItem>
            <NavItem active>Events</NavItem>
            <NavItem>Directory</NavItem>
            <NavItem>Notifications</NavItem>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#DDD6C8] bg-[#0D1824]">
        <div className="absolute inset-0 opacity-18">
          <img src="/legacy-assets/iwfsa-home.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07131D] via-[#07131D]/92 to-[#07131D]/68" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-12 lg:py-14">
          <div className="lg:col-span-8">
            <Chip tone="private"><ShieldCheck className="mr-2 h-3.5 w-3.5" /> Member-only surface</Chip>
            <h1 className="mt-5 max-w-4xl font-serif text-[36px] leading-[1.08] text-white md:text-[48px]">Choose and manage event participation</h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/78">Published member events appear here with clear capacity, RSVP, and waitlist status. This page is a service surface for members, not an administrative event editor.</p>
          </div>
          <aside className="rounded-lg border border-white/14 bg-white/9 p-5 shadow-2xl backdrop-blur lg:col-span-4">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="font-serif text-2xl text-white">Your event note</h2>
                <p className="mt-2 text-sm leading-6 text-white/75">Annual Member Assembly is already confirmed. Two events are available for action.</p>
              </div>
            </div>
            <button className="mt-5 min-h-11 w-full rounded-md border border-[#D4AF37] bg-[#003366] px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Review confirmed RSVP</button>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="rounded-lg border border-[#DDD6C8] bg-white p-4 shadow-[0_12px_24px_rgba(7,19,29,0.05)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-[#07131D]">Available events</h2>
                  <p className="mt-1 text-sm text-[#4D5A66]">Search and filter without leaving the member event board.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
                  <label className="relative block">
                    <span className="sr-only">Search events</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4D5A66]" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" className="min-h-11 w-full rounded-md border border-[#CFC6B7] bg-white pl-10 pr-3 text-sm text-[#1A1A1A] focus:border-[#005FCC] focus:outline-none focus:ring-2 focus:ring-[#005FCC]/25" />
                  </label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-11 rounded-md border border-[#CFC6B7] bg-white px-3 text-sm font-medium text-[#1A1A1A] focus:border-[#005FCC] focus:outline-none focus:ring-2 focus:ring-[#005FCC]/25">
                    {filterOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {showDemoState === "loading" ? <div className="xl:col-span-2"><LoadingState /></div> : filteredEvents.length > 0 ? filteredEvents.map((event) => <EventCard key={event.id} event={event} onRSVP={handleRSVP} />) : <div className="xl:col-span-2"><EmptyState /></div>}
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-4">
            <StatePanel type={statusMessage} />

            <section className="rounded-lg border border-[#DDD6C8] bg-[#FBF7EF] p-5 shadow-[0_12px_24px_rgba(7,19,29,0.05)]">
              <h2 className="font-serif text-2xl text-[#07131D]">Preview states</h2>
              <p className="mt-2 text-sm leading-6 text-[#4D5A66]">These controls demonstrate the required member-facing states for implementation review.</p>
              <div className="mt-4 grid gap-2">
                <button onClick={() => { setShowDemoState("cards"); setStatusMessage("success"); }} className="min-h-11 rounded-md border border-[#D4AF37] bg-white px-4 text-left text-sm font-semibold text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Success state</button>
                <button onClick={() => { setShowDemoState("cards"); setStatusMessage("waitlist"); }} className="min-h-11 rounded-md border border-[#ED6C02]/35 bg-white px-4 text-left text-sm font-semibold text-[#8A4200] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Waitlist state</button>
                <button onClick={() => { setShowDemoState("cards"); setStatusMessage("error"); }} className="min-h-11 rounded-md border border-[#C62828]/35 bg-white px-4 text-left text-sm font-semibold text-[#C62828] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Failure state</button>
                <button onClick={() => setShowDemoState("loading")} className="min-h-11 rounded-md border border-[#CFC6B7] bg-white px-4 text-left text-sm font-semibold text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Loading state</button>
                <button onClick={() => { setShowDemoState("cards"); setQuery("zzzz no event"); }} className="min-h-11 rounded-md border border-[#CFC6B7] bg-white px-4 text-left text-sm font-semibold text-[#003366] focus:outline-none focus:ring-2 focus:ring-[#005FCC]">Empty state</button>
              </div>
            </section>

            <section className="rounded-lg border border-[#DDD6C8] bg-white p-5 shadow-[0_12px_24px_rgba(7,19,29,0.05)]">
              <h2 className="font-serif text-2xl text-[#07131D]">Member boundary</h2>
              <p className="mt-2 text-sm leading-6 text-[#4D5A66]">This surface intentionally excludes create, edit, delete, lifecycle, and audit controls. Those belong only on the admin events surface.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip tone="published">Member navigation only</Chip>
                <Chip tone="neutral">No admin controls</Chip>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
