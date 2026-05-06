export type DesignSurface = "public" | "member" | "admin";
export type DesignStatusTone = "members" | "public" | "private" | "audit" | "warning";
export type DesignStatusBadge = { label: string; tone?: DesignStatusTone };
export type PriorityItem = {
  title: string;
  body: string;
  badges: DesignStatusBadge[];
};

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderVisibilityBadge(item: DesignStatusBadge): string {
  return `<span class="status-badge ${item.tone || ""}" aria-label="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>`;
}

export function renderStatusSummary(items: DesignStatusBadge[]): string {
  return `<p class="status-row">${items.map(renderVisibilityBadge).join("")}</p>`;
}

export function renderPriorityPanel(item: PriorityItem): string {
  return `<article class="design-panel">
    <h3>${escapeHtml(item.title)}</h3>
    ${renderStatusSummary(item.badges)}
    <p>${escapeHtml(item.body)}</p>
  </article>`;
}

export function renderInfoCallout(input: { id: string; title: string; body: string; surface: DesignSurface }): string {
  const titleId = `${input.id}-title`;
  const copyId = `${input.id}-copy`;
  return `<div class="info-callout" data-component="InfoCallout" data-surface="${input.surface}" role="note" aria-labelledby="${titleId}" aria-describedby="${copyId}">
    <strong id="${titleId}">${escapeHtml(input.title)}</strong>
    <p id="${copyId}">${escapeHtml(input.body)}</p>
  </div>`;
}

export function renderStatusBadges(items: DesignStatusBadge[]): string {
  return renderStatusSummary(items);
}
