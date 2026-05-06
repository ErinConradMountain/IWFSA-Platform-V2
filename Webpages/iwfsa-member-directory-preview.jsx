/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useMemo, useState } from "react";
import { Search, ShieldCheck, RotateCcw, Lock, Users, CheckCircle2, AlertTriangle, Loader2, Eye, MapPin, Building2, Filter, Mail, ArrowRight } from "lucide-react";

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
  members: "#00695C",
  publicSafe: "#2E7D32",
  private: "#5B4B8A",
  warning: "#ED6C02",
  error: "#C62828",
};

const members = [
  {
    name: "Dr. Naledi Mokoena",
    role: "Chief Strategy Officer",
    organisation: "Civic Futures Institute",
    sector: "Civic Leadership",
    region: "Gauteng",
    group: "Forum Fellow",
    visibility: "Members only",
    visibilityType: "members",
    initials: "NM",
    note: "Available for member-to-member introductions through IWFSA channels.",
  },
  {
    name: "Ayanda Dlamini",
    role: "Founder and Executive Chair",
    organisation: "Sisonke Advisory Group",
    sector: "Enterprise",
    region: "Western Cape",
    group: "Chapter Leader",
    visibility: "Public-safe",
    visibilityType: "public",
    initials: "AD",
    note: "Approved summary visible to members. Public projection remains consent-gated.",
  },
  {
    name: "Prof. Thandi Jacobs",
    role: "Dean of Innovation Partnerships",
    organisation: "Southern Learning Council",
    sector: "Education",
    region: "KwaZulu-Natal",
    group: "Member",
    visibility: "Members only",
    visibilityType: "members",
    initials: "TJ",
    note: "Directory details limited to member-approved professional context.",
  },
  {
    name: "Lindiwe Naidoo",
    role: "Board Advisor",
    organisation: "Ubuntu Capital Trust",
    sector: "Finance",
    region: "Gauteng",
    group: "Member",
    visibility: "Members only",
    visibilityType: "members",
    initials: "LN",
    note: "Contact request requires member channel mediation.",
  },
  {
    name: "Zanele Khumalo",
    role: "Director of Public Programmes",
    organisation: "Heritage Futures Foundation",
    sector: "Arts and Culture",
    region: "Eastern Cape",
    group: "Member",
    visibility: "Private summary",
    visibilityType: "private",
    initials: "ZK",
    note: "Profile appears because member-directory consent is active; private fields remain hidden.",
  },
];

const sectorOptions = ["All sectors", "Civic Leadership", "Enterprise", "Education", "Finance", "Arts and Culture"];
const regionOptions = ["All regions", "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"];
const visibilityOptions = ["All visibility", "Members only", "Public-safe", "Private summary"];

function Badge({ type, children }) {
  const styles = {
    members: { color: tokens.members, bg: "rgba(0, 105, 92, 0.09)", border: "rgba(0, 105, 92, 0.22)", icon: Users },
    public: { color: tokens.publicSafe, bg: "rgba(46, 125, 50, 0.09)", border: "rgba(46, 125, 50, 0.22)", icon: CheckCircle2 },
    private: { color: tokens.private, bg: "rgba(91, 75, 138, 0.09)", border: "rgba(91, 75, 138, 0.22)", icon: Lock },
  };
  const current = styles[type] || styles.members;
  const Icon = current.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" style={{ color: current.color, background: current.bg, borderColor: current.border }}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function Header() {
  return (
    <header className="border-b" style={{ background: "rgba(255,255,255,0.92)", borderColor: "rgba(0,51,102,0.12)" }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-white shadow-sm" style={{ borderColor: "rgba(0,51,102,0.16)" }}>
            <img src="/legacy-assets/iwfsa-logo.svg" alt="IWFSA logo" className="h-11 w-11 object-contain" />
          </div>
          <div>
            <p className="font-serif text-xl leading-tight" style={{ color: tokens.navy }}>International Women&apos;s Forum South Africa</p>
            <p className="text-sm" style={{ color: tokens.muted }}>Member workspace - Directory</p>
          </div>
        </div>
        <nav aria-label="Member navigation" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {['Dashboard', 'Profile', 'Events', 'Directory', 'Notifications'].map((item) => (
            <a key={item} href="#" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition" style={{ color: item === 'Directory' ? tokens.ink : tokens.navy, background: item === 'Directory' ? 'rgba(212,175,55,0.22)' : 'transparent', border: item === 'Directory' ? `1px solid rgba(212,175,55,0.55)` : '1px solid transparent' }}>
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function StatePanel({ state }) {
  const config = {
    loading: {
      icon: Loader2,
      title: "Loading visible members",
      text: "The directory is checking consent and visibility boundaries before showing entries.",
      color: tokens.navy,
      spin: true,
    },
    success: {
      icon: CheckCircle2,
      title: "Directory preferences saved",
      text: "Your directory view has been updated. Private fields remain hidden unless consent explicitly allows them.",
      color: tokens.publicSafe,
    },
    warning: {
      icon: AlertTriangle,
      title: "Consent boundary active",
      text: "Some members are not shown because their directory consent or standing does not allow visibility here.",
      color: tokens.warning,
    },
    error: {
      icon: AlertTriangle,
      title: "Directory could not refresh",
      text: "Try again shortly. No private member information has been exposed during this error.",
      color: tokens.error,
    },
  }[state];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <section className="mb-5 rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: `${config.color}33` }} aria-live="polite">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: `${config.color}12`, color: config.color }}>
          <Icon className={`h-5 w-5 ${config.spin ? 'animate-spin' : ''}`} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-xl" style={{ color: tokens.text }}>{config.title}</h2>
          <p className="mt-1 text-sm leading-6" style={{ color: tokens.muted }}>{config.text}</p>
        </div>
      </div>
    </section>
  );
}

function MemberEntry({ member }) {
  return (
    <article className="group rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border font-serif text-lg" style={{ background: tokens.warmPanel, color: tokens.navy, borderColor: "rgba(212,175,55,0.42)" }} aria-hidden="true">
            {member.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl leading-tight" style={{ color: tokens.ink }}>{member.name}</h3>
              <Badge type={member.visibilityType}>{member.visibility}</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: tokens.text }}>{member.role}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: tokens.muted }}>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" aria-hidden="true" />{member.organisation}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{member.region}</span>
            </div>
            <p className="mt-3 text-sm leading-6" style={{ color: tokens.muted }}>{member.note}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(0,51,102,0.07)", color: tokens.navy }}>{member.sector}</span>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: "rgba(0,51,102,0.22)", color: tokens.navy, background: tokens.white, focusRingColor: tokens.focus }}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            View visible profile
          </button>
        </div>
      </div>
    </article>
  );
}

export default function IwfsMemberDirectoryPreview() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [region, setRegion] = useState("All regions");
  const [visibility, setVisibility] = useState("All visibility");
  const [demoState, setDemoState] = useState("success");

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery = !q || [member.name, member.role, member.organisation, member.sector, member.region].join(" ").toLowerCase().includes(q);
      const matchesSector = sector === "All sectors" || member.sector === sector;
      const matchesRegion = region === "All regions" || member.region === region;
      const matchesVisibility = visibility === "All visibility" || member.visibility === visibility;
      return matchesQuery && matchesSector && matchesRegion && matchesVisibility;
    });
  }, [query, sector, region, visibility]);

  const resetFilters = () => {
    setQuery("");
    setSector("All sectors");
    setRegion("All regions");
    setVisibility("All visibility");
  };

  return (
    <main className="min-h-screen" style={{ background: `linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 48%, ${tokens.warmBottom} 100%)`, color: tokens.text }}>
      <Header />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-lg border p-6 shadow-sm md:p-8" style={{ background: `linear-gradient(135deg, ${tokens.ink}, #0D1824 55%, ${tokens.navy})`, borderColor: "rgba(212,175,55,0.28)" }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ color: tokens.gold, borderColor: "rgba(212,175,55,0.42)", background: "rgba(255,255,255,0.06)" }}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Protected member surface
              </div>
              <h1 className="font-serif text-4xl leading-tight md:text-5xl" style={{ color: tokens.white }}>Consent-scoped directory</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg" style={{ color: "rgba(255,255,255,0.82)" }}>
                Browse professional member profiles that are visible under current consent rules. Private information remains withheld unless a member has explicitly allowed it.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#directory-results" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold shadow-sm" style={{ background: tokens.white, color: tokens.navy, border: `1px solid ${tokens.gold}` }}>
                  Search directory <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: tokens.white, borderColor: "rgba(255,255,255,0.26)" }}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Request introduction guidance
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="h-full rounded-lg border p-5 shadow-sm" style={{ background: tokens.white, borderColor: "rgba(0,51,102,0.12)" }}>
              <h2 className="font-serif text-2xl" style={{ color: tokens.ink }}>Visibility model</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: tokens.muted }}>The directory is a member service, not a public profile gallery.</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-md p-3" style={{ background: "rgba(91,75,138,0.08)" }}>
                  <Lock className="mt-0.5 h-5 w-5" style={{ color: tokens.private }} aria-hidden="true" />
                  <div><p className="text-sm font-semibold" style={{ color: tokens.text }}>Private</p><p className="text-xs leading-5" style={{ color: tokens.muted }}>Hidden fields are never shown in this list.</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-md p-3" style={{ background: "rgba(0,105,92,0.08)" }}>
                  <Users className="mt-0.5 h-5 w-5" style={{ color: tokens.members }} aria-hidden="true" />
                  <div><p className="text-sm font-semibold" style={{ color: tokens.text }}>Members only</p><p className="text-xs leading-5" style={{ color: tokens.muted }}>Visible inside the protected member workspace.</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-md p-3" style={{ background: "rgba(46,125,50,0.08)" }}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: tokens.publicSafe }} aria-hidden="true" />
                  <div><p className="text-sm font-semibold" style={{ color: tokens.text }}>Public-safe</p><p className="text-xs leading-5" style={{ color: tokens.muted }}>Still governed by approval before public rendering.</p></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="directory-results" className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-4 rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" style={{ color: tokens.navy }} aria-hidden="true" />
                <h2 className="font-serif text-2xl" style={{ color: tokens.ink }}>Filters</h2>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: tokens.text }}>Search by name, role, organisation</span>
                  <div className="mt-2 flex min-h-11 items-center gap-2 rounded-md border bg-white px-3" style={{ borderColor: "rgba(0,51,102,0.22)" }}>
                    <Search className="h-4 w-4" style={{ color: tokens.muted }} aria-hidden="true" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search directory" aria-label="Search directory" />
                  </div>
                </label>
                {[{ label: 'Sector', value: sector, set: setSector, options: sectorOptions }, { label: 'Region', value: region, set: setRegion, options: regionOptions }, { label: 'Visibility', value: visibility, set: setVisibility, options: visibilityOptions }].map((control) => (
                  <label className="block" key={control.label}>
                    <span className="text-sm font-semibold" style={{ color: tokens.text }}>{control.label}</span>
                    <select value={control.value} onChange={(e) => control.set(e.target.value)} className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2" style={{ borderColor: "rgba(0,51,102,0.22)", color: tokens.text }}>
                      {control.options.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
                <button onClick={resetFilters} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold" style={{ background: tokens.warmPanel, color: tokens.navy, borderColor: "rgba(212,175,55,0.45)" }}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset filters
                </button>
              </div>

              <div className="mt-6 border-t pt-5" style={{ borderColor: "rgba(0,51,102,0.10)" }}>
                <p className="text-xs font-semibold uppercase" style={{ color: tokens.muted }}>Preview states</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {['success', 'warning', 'loading', 'error'].map((state) => (
                    <button key={state} onClick={() => setDemoState(state)} className="min-h-11 rounded-md border px-3 text-xs font-semibold capitalize" style={{ background: demoState === state ? tokens.navy : tokens.white, color: demoState === state ? tokens.white : tokens.navy, borderColor: "rgba(0,51,102,0.18)" }}>{state}</button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <StatePanel state={demoState} />
            <div className="mb-4 flex flex-col justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center" style={{ borderColor: "rgba(0,51,102,0.12)" }}>
              <div>
                <h2 className="font-serif text-2xl" style={{ color: tokens.ink }}>Visible member entries</h2>
                <p className="mt-1 text-sm" style={{ color: tokens.muted }}>{filteredMembers.length} result{filteredMembers.length === 1 ? '' : 's'} available within current consent and filter settings.</p>
              </div>
              <Badge type="members">Consent checked</Badge>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="space-y-4">
                {filteredMembers.map((member) => <MemberEntry key={member.name} member={member} />)}
              </div>
            ) : (
              <div className="rounded-lg border p-8 text-center shadow-sm" style={{ background: tokens.warmPanel, borderColor: "rgba(212,175,55,0.35)" }}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(0,51,102,0.08)", color: tokens.navy }}>
                  <Search className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-serif text-2xl" style={{ color: tokens.ink }}>No visible members match these filters</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: tokens.muted }}>Some members may be hidden by consent, standing, or visibility settings. Reset filters to broaden the member-scoped view.</p>
                <button onClick={resetFilters} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold" style={{ background: tokens.navy, color: tokens.white, border: `1px solid ${tokens.gold}` }}>
                  Reset directory view
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}