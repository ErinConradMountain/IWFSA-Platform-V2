/*
VISUAL PROTOTYPE ONLY - NOT PRODUCTION-READY
This JSX file is a handoff preview for design review. Before implementation, replace local token objects, inline styles, demo data, and hard-coded colors with production components that consume apps/common/src/design-tokens.ts, enforce route policy checks, use a single data-primary-action CTA, and keep preview-state demos out of live member/admin routes.

Preview mobile/accessibility sign-off: no text clipping; buttons and inputs at least 44px high; keyboard focus visible; state badges include text and do not rely on color alone; mobile navigation remains surface-scoped; warning/error messages stay respectful and non-shaming.
*/
import React, { useState } from "react";
import { ShieldCheck, Lock, Users, Globe2, AlertTriangle, CheckCircle2, Loader2, Home, ArrowRight, Info } from "lucide-react";

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
  deepInk: "#07131D",
  private: "#5B4B8A",
  members: "#00695C",
  publicSafe: "#2E7D32",
  audit: "#6A4A00",
  warning: "#ED6C02",
  error: "#C62828",
};

function Badge({ icon: Icon, label, description, color }) {
  return (
    <div className="visibility-badge" style={{ borderColor: `${color}33`, background: `${color}0D` }}>
      <span className="badge-icon" style={{ background: color }} aria-hidden="true">
        <Icon size={17} />
      </span>
      <span>
        <strong style={{ color }}>{label}</strong>
        <small>{description}</small>
      </span>
    </div>
  );
}

function StatePanel({ state }) {
  const states = {
    empty: {
      icon: Info,
      title: "No consent choice has been recorded yet",
      text: "You can review each visibility level before any profile or directory information is shown within the member workspace.",
      tone: tokens.audit,
    },
    loading: {
      icon: Loader2,
      title: "Checking your consent status",
      text: "We are confirming which member features are available under your current visibility choices.",
      tone: tokens.navy,
      spin: true,
    },
    success: {
      icon: CheckCircle2,
      title: "Consent preferences saved",
      text: "Your choices have been recorded. You remain in control and may update visibility preferences later.",
      tone: tokens.publicSafe,
    },
    warning: {
      icon: AlertTriangle,
      title: "Consent is required before continuing",
      text: "Profile and directory areas remain paused until you review and confirm your visibility choices.",
      tone: tokens.warning,
    },
    error: {
      icon: AlertTriangle,
      title: "Consent status could not be loaded",
      text: "Please try again. No private information has been changed or exposed.",
      tone: tokens.error,
    },
  };

  const current = states[state];
  const Icon = current.icon;

  return (
    <section className="state-panel" style={{ borderColor: `${current.tone}55` }} aria-live="polite">
      <div className="state-icon" style={{ color: current.tone }}>
        <Icon className={current.spin ? "spin" : ""} size={22} />
      </div>
      <div>
        <h3>{current.title}</h3>
        <p>{current.text}</p>
      </div>
    </section>
  );
}

export default function IWFSAConsentRequiredPreview() {
  const [state, setState] = useState("warning");

  return (
    <main className="page-shell">
      <style>{`
        :root {
          color: ${tokens.text};
          background: ${tokens.warmMid};
        }

        * { box-sizing: border-box; }

        .page-shell {
          min-height: 100vh;
          font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(212, 175, 55, 0.16), transparent 32rem),
            linear-gradient(180deg, ${tokens.warmTop} 0%, ${tokens.warmMid} 46%, ${tokens.warmBottom} 100%);
          padding: 24px;
        }

        .workspace {
          max-width: 1180px;
          margin: 0 auto;
        }

        .member-header {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 14px 18px;
          border: 1px solid rgba(0, 51, 102, 0.14);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 18px 46px rgba(7, 19, 29, 0.08);
          backdrop-filter: blur(18px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 270px;
        }

        .logo-mark {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: ${tokens.navy};
          color: ${tokens.white};
          display: grid;
          place-items: center;
          box-shadow: inset 0 -3px 0 ${tokens.gold};
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          line-height: 1;
        }

        .brand-title {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          color: ${tokens.navy};
          font-weight: 600;
        }

        .brand-subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: ${tokens.muted};
        }

        .member-nav {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .member-nav a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 0 13px;
          border-radius: 999px;
          color: ${tokens.navy};
          text-decoration: none;
          font-size: 14px;
          font-weight: 650;
          outline: none;
        }

        .member-nav a:focus-visible,
        button:focus-visible,
        .state-tab:focus-visible {
          outline: 3px solid ${tokens.focus};
          outline-offset: 3px;
        }

        .member-nav a.active {
          background: ${tokens.navy};
          color: ${tokens.white};
          box-shadow: inset 0 -3px 0 ${tokens.gold};
        }

        .hero {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
          align-items: stretch;
        }

        .hero-copy {
          grid-column: span 7;
          padding: 42px;
          border-radius: 8px;
          color: ${tokens.white};
          background:
            linear-gradient(145deg, rgba(7, 19, 29, 0.96), rgba(0, 51, 102, 0.94)),
            url('/legacy-assets/iwfsa-home.jpg');
          background-size: cover;
          background-position: center;
          box-shadow: 0 24px 60px rgba(7, 19, 29, 0.18);
          position: relative;
          overflow: hidden;
        }

        .hero-copy::after {
          content: "";
          position: absolute;
          inset: auto 42px 0 42px;
          height: 4px;
          background: ${tokens.gold};
          border-radius: 8px 8px 0 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: #F4E4B8;
          font-size: 12px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        h1 {
          margin: 0;
          max-width: 720px;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 500;
          font-size: clamp(34px, 5vw, 48px);
          line-height: 1.08;
        }

        .hero-copy .purpose {
          max-width: 660px;
          margin: 20px 0 0;
          color: rgba(255, 255, 255, 0.86);
          font-size: 17px;
          line-height: 1.65;
        }

        .action-panel {
          grid-column: span 5;
          padding: 30px;
          border-radius: 8px;
          background: ${tokens.white};
          border: 1px solid rgba(0, 51, 102, 0.14);
          box-shadow: 0 22px 54px rgba(7, 19, 29, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 26px;
        }

        .action-panel h2,
        .privacy-card h2,
        .model-card h2,
        .states-card h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 500;
          color: ${tokens.navy};
        }

        .action-panel p,
        .privacy-card p,
        .model-card p,
        .states-card p {
          margin: 10px 0 0;
          color: ${tokens.muted};
          line-height: 1.58;
          font-size: 15.5px;
        }

        .primary-action,
        .secondary-action {
          min-height: 48px;
          width: 100%;
          border-radius: 8px;
          font-weight: 750;
          font-size: 15px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .primary-action {
          border: 1px solid ${tokens.gold};
          background: ${tokens.navy};
          color: ${tokens.white};
          box-shadow: 0 12px 22px rgba(0, 51, 102, 0.2);
        }

        .secondary-action {
          margin-top: 12px;
          border: 1px solid rgba(0, 51, 102, 0.22);
          background: ${tokens.warmPanel};
          color: ${tokens.navy};
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-1px);
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
          margin-top: 24px;
        }

        .privacy-card,
        .model-card,
        .states-card {
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 51, 102, 0.14);
          box-shadow: 0 16px 44px rgba(7, 19, 29, 0.07);
        }

        .privacy-card {
          grid-column: span 7;
          padding: 30px;
        }

        .model-card {
          grid-column: span 5;
          padding: 30px;
        }

        .states-card {
          grid-column: span 12;
          padding: 26px;
        }

        .visibility-list {
          display: grid;
          gap: 14px;
          margin-top: 22px;
        }

        .visibility-badge {
          min-height: 74px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px;
          border: 1px solid;
          border-radius: 8px;
        }

        .badge-icon {
          flex: 0 0 38px;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          color: ${tokens.white};
          display: grid;
          place-items: center;
        }

        .visibility-badge strong {
          display: block;
          font-size: 15px;
        }

        .visibility-badge small {
          display: block;
          margin-top: 3px;
          color: ${tokens.muted};
          font-size: 13.5px;
          line-height: 1.42;
        }

        .steps {
          margin: 22px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 14px;
          counter-reset: step;
        }

        .steps li {
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 12px;
          align-items: start;
          color: ${tokens.muted};
          line-height: 1.5;
        }

        .steps li::before {
          counter-increment: step;
          content: counter(step);
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: ${tokens.warmPanel};
          border: 1px solid rgba(212, 175, 55, 0.55);
          color: ${tokens.navy};
          font-weight: 800;
          font-size: 13px;
        }

        .state-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0 18px;
        }

        .state-tab {
          min-height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(0, 51, 102, 0.18);
          background: ${tokens.white};
          color: ${tokens.navy};
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .state-tab.active {
          color: ${tokens.white};
          background: ${tokens.navy};
          border-color: ${tokens.navy};
          box-shadow: inset 0 -3px 0 ${tokens.gold};
        }

        .state-panel {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px;
          border-left: 4px solid;
          border-top: 1px solid;
          border-right: 1px solid;
          border-bottom: 1px solid;
          border-radius: 8px;
          background: ${tokens.warmPanel};
        }

        .state-panel h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          color: ${tokens.text};
          font-weight: 500;
        }

        .state-panel p {
          margin: 7px 0 0;
        }

        .state-icon {
          margin-top: 2px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .governance-note {
          margin-top: 20px;
          padding: 14px 16px;
          border-radius: 8px;
          border: 1px solid rgba(106, 74, 0, 0.25);
          background: rgba(251, 247, 239, 0.92);
          color: ${tokens.muted};
          font-size: 14px;
          line-height: 1.55;
        }

        @media (max-width: 900px) {
          .page-shell { padding: 16px; }

          .member-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .member-nav {
            justify-content: flex-start;
            width: 100%;
          }

          .member-nav a {
            flex: 1 1 130px;
            justify-content: center;
          }

          .hero-copy,
          .action-panel,
          .privacy-card,
          .model-card,
          .states-card {
            grid-column: 1 / -1;
          }

          .hero-copy,
          .action-panel,
          .privacy-card,
          .model-card,
          .states-card {
            padding: 24px;
          }
        }

        @media (max-width: 560px) {
          .brand { min-width: 0; }
          .brand-title { font-size: 17px; }
          .logo-mark { width: 44px; height: 44px; }
          .hero-copy::after { left: 24px; right: 24px; }
          .state-panel { flex-direction: column; }
        }
      `}</style>

      <div className="workspace">
        <header className="member-header" aria-label="IWFSA member workspace header">
          <div className="brand">
            <div className="logo-mark" aria-label="IWFSA logo">IWF</div>
            <div>
              <p className="brand-title">International Women's Forum South Africa</p>
              <p className="brand-subtitle">Member workspace - Consent gate</p>
            </div>
          </div>
          <nav className="member-nav" aria-label="Member navigation">
            <a href="#dashboard">Dashboard</a>
            <a href="#profile" className="active">Profile</a>
            <a href="#events">Events</a>
            <a href="#directory">Directory</a>
            <a href="#notifications">Notifications</a>
          </nav>
        </header>

        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <span className="eyebrow"><ShieldCheck size={16} /> Member consent required</span>
            <h1 id="page-title">Consent required</h1>
            <p className="purpose">
              Before profile and directory features continue, IWFSA asks you to review how your information may be used inside the member workspace. Nothing proceeds until you choose what feels appropriate.
            </p>
          </div>

          <aside className="action-panel" aria-labelledby="primary-action-title">
            <div>
              <h2 id="primary-action-title">Review your consent choices</h2>
              <p>
                Your profile, directory presence, and any public-safe material remain paused until visibility preferences are confirmed.
              </p>
            </div>
            <div>
              <a className="primary-action" href="#review-consent">
                Review consent <ArrowRight size={18} />
              </a>
              <a className="secondary-action" href="#dashboard">
                <Home size={17} /> Return to dashboard
              </a>
            </div>
          </aside>
        </section>

        <section className="content-grid">
          <article className="privacy-card" aria-labelledby="privacy-title">
            <h2 id="privacy-title">Your visibility model, at a glance</h2>
            <p>
              Consent is not a formality. It is the member's control surface: what remains private, what may be shared with members, and what could be prepared as public-safe material only where approval rules allow it.
            </p>

            <div className="visibility-list" aria-label="Visibility levels affected by consent">
              <Badge
                icon={Lock}
                label="Private"
                description="Held for your own member record and not shown in directory or public views."
                color={tokens.private}
              />
              <Badge
                icon={Users}
                label="Members only"
                description="Visible only within the protected IWFSA member workspace under consent rules."
                color={tokens.members}
              />
              <Badge
                icon={Globe2}
                label="Public-safe"
                description="Eligible only for approved public projection when consent, standing, and review allow it."
                color={tokens.publicSafe}
              />
            </div>
          </article>

          <article className="model-card" aria-labelledby="what-happens-title">
            <h2 id="what-happens-title">What happens next</h2>
            <p>
              The page gives one clear path forward without pressure, hidden admin detail, or legal-heavy language.
            </p>
            <ol className="steps">
              <li>Review each visibility level in plain language.</li>
              <li>Confirm whether profile and directory features may continue.</li>
              <li>Return to the member workspace with your choices clearly recorded.</li>
            </ol>
            <div className="governance-note">
              Public, member, and private surfaces remain visually distinct. Consent does not imply public publication.
            </div>
          </article>

          <article className="states-card" aria-labelledby="states-title">
            <h2 id="states-title">Interaction states</h2>
            <p>
              These states keep the consent gate usable during real application conditions without exposing private or technical detail.
            </p>
            <div className="state-tools" role="tablist" aria-label="Preview consent page states">
              {["empty", "loading", "success", "warning", "error"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`state-tab ${state === item ? "active" : ""}`}
                  onClick={() => setState(item)}
                  aria-selected={state === item}
                  role="tab"
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
            <StatePanel state={state} />
          </article>
        </section>
      </div>
    </main>
  );
}
