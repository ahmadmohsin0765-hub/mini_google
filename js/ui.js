/**
 * ARCHON SEARCH '98 - UI Rendering and View Controller
 */

import { formatNumber } from "./rankingEngine.js";

/**
 * Safely escape HTML to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Highlight matched query terms inside snippet text
 */
export function highlightTerms(text, tokens = []) {
  if (!text) return "";
  const escaped = escapeHtml(text);
  if (!tokens || tokens.length === 0) return escaped;

  // Filter valid alphanumeric tokens
  const cleanTokens = tokens
    .map(t => t.trim())
    .filter(t => t.length > 1)
    .map(escapeRegExp);

  if (cleanTokens.length === 0) return escaped;

  const regex = new RegExp(`\\b(${cleanTokens.join("|")})`, "gi");
  return escaped.replace(regex, '<mark class="highlight-match">$1</mark>');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Format duration in seconds to "Xm Ys" or "Xs"
 */
export function formatDuration(seconds) {
  const s = Math.round(Number(seconds) || 0);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const remSecs = s % 60;
  return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
}

/**
 * Render individual search result card HTML
 */
export function renderResultCard(resultItem, index, queryTokens, queryStr) {
  const { page, finalScore, signals, contributions, explanations } = resultItem;
  const rank = index + 1;
  const cardId = `result-card-${page.id}`;
  const breakdownId = `breakdown-${page.id}`;

  const highlightedTitle = highlightTerms(page.title, queryTokens);
  const highlightedSnippet = highlightTerms(page.description, queryTokens);

  // Badges HTML
  const badgesHtml = explanations.badges
    .map(b => `<span class="why-pill ${b.type}">${escapeHtml(b.text)}</span>`)
    .join("");

  // Reasons bullets HTML
  const reasonsHtml = explanations.bulletReasons
    .map(r => `<li>${escapeHtml(r)}</li>`)
    .join("");

  // Contribution rows for breakdown table
  const signalRows = [
    { label: "Query Relevance", data: contributions.relevance, hint: `${signals.relevance.details.matchedCount} of ${signals.relevance.details.totalQueryTokens} terms matched` },
    { label: "Link Citation Graph", data: contributions.links, hint: `${signals.links.inboundLinks} inbound links (${Math.round(signals.links.inboundQuality * 100)}% quality)` },
    { label: "Reader Engagement", data: contributions.engagement, hint: `${formatDuration(signals.engagement.seconds)} dwell (${signals.engagement.category})` },
    { label: "Popularity (Views)", data: contributions.popularity, hint: `${formatNumber(signals.popularity.views)} views (log-damped)` },
    { label: "User Behavior", data: contributions.behavior, hint: `${signals.behavior.ctr}% CTR, ${signals.behavior.satisfactionPercent}% satisfied` },
    { label: "Quality & Freshness", data: contributions.quality, hint: `Quality: ${Math.round(signals.quality.qualityRating * 100)}%, Freshness: ${Math.round(signals.quality.freshnessRating * 100)}%` }
  ];

  const tableRowsHtml = signalRows.map(row => {
    const rawVal = row.data.rawScore;
    const pts = row.data.points;
    const w = row.data.weight;
    return `
      <tr>
        <td>
          <strong>${escapeHtml(row.label)}</strong>
          <div style="font-size: 0.72rem; color: #666;">${escapeHtml(row.hint)}</div>
        </td>
        <td class="numeric">${rawVal}/100</td>
        <td class="numeric">${w}%</td>
        <td class="numeric" style="font-weight: bold; color: #003366;">+${pts} pts</td>
        <td style="width: 80px; vertical-align: middle;">
          <div class="bar-container">
            <div class="bar-fill" style="width: ${Math.min(100, Math.max(2, rawVal))}%;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <li class="result-card" id="${cardId}" data-id="${page.id}">
      <article>
        <div class="result-header">
          <span class="rank-badge" title="Rank Position">#${rank}</span>
          <h3 style="margin: 0;">
            <a href="${escapeHtml(page.url)}" class="result-title-link" target="_blank" rel="noopener noreferrer">
              ${highlightedTitle}
            </a>
          </h3>
        </div>
        <div class="result-url">${escapeHtml(page.url)}</div>
        <p class="result-snippet">${highlightedSnippet}</p>

        <!-- Metrics Row -->
        <div class="result-metrics-bar">
          <span class="metric-item" title="Estimated Readers">
            👁 <strong>${formatNumber(page.views)}</strong> views
          </span>
          <span class="metric-item" title="Average Time on Page">
            ⏱ <strong>${formatDuration(page.avgTimeOnPage)}</strong> dwell
          </span>
          <span class="metric-item" title="Inbound Hyperlink Citations">
            ↗ <strong>${page.inboundLinks}</strong> inbound links
          </span>
          <span class="metric-item" title="Post-Click User Satisfaction">
            👥 <strong>${Math.round(page.satisfactionRate * 100)}%</strong> satisfied
          </span>
          <span class="metric-item" style="margin-left: auto;">
            <span class="score-badge">Total Score: ${finalScore}</span>
          </span>
        </div>

        <!-- "Why this result?" Container -->
        <div class="why-result-container">
          <div class="why-header">
            <div class="why-pills-row">
              <strong style="font-size: 0.8rem; color: #333;">Why this result:</strong>
              ${badgesHtml}
            </div>
            <button
              type="button"
              class="inspect-toggle-btn"
              data-target="${breakdownId}"
              aria-expanded="false"
              aria-controls="${breakdownId}"
            >
              Inspect Score Breakdown ▼
            </button>
          </div>

          <!-- Expandable Breakdown Drawer -->
          <div class="breakdown-drawer hidden" id="${breakdownId}">
            <div style="margin-bottom: 0.5rem; font-size: 0.82rem;">
              <strong>Primary ranking driver:</strong> ${escapeHtml(explanations.primaryDriver)}
            </div>
            <ul style="margin: 0 0 0.5rem 1.25rem; padding: 0; color: #444;">
              ${reasonsHtml}
            </ul>

            <table class="breakdown-table" aria-label="Score calculation points table">
              <thead>
                <tr>
                  <th>Signal</th>
                  <th class="numeric">Raw Score</th>
                  <th class="numeric">Weight</th>
                  <th class="numeric">Points</th>
                  <th>Strength</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr style="background: #e6edf5; font-weight: bold;">
                  <td>Final Composite Score</td>
                  <td class="numeric">-</td>
                  <td class="numeric">100%</td>
                  <td class="numeric" style="color: #003366;">${finalScore}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </li>
  `;
}

/**
 * Setup Expand/Collapse listener on the results list
 */
export function bindBreakdownToggles(resultsListEl) {
  resultsListEl.addEventListener("click", (event) => {
    const btn = event.target.closest(".inspect-toggle-btn");
    if (!btn) return;

    const targetId = btn.getAttribute("data-target");
    const doc = btn.ownerDocument || document;
    const drawer = doc.getElementById(targetId);
    if (!drawer) return;

    const isHidden = drawer.classList.contains("hidden");
    if (isHidden) {
      drawer.classList.remove("hidden");
      btn.textContent = "Hide Score Breakdown ▲";
      btn.setAttribute("aria-expanded", "true");
    } else {
      drawer.classList.add("hidden");
      btn.textContent = "Inspect Score Breakdown ▼";
      btn.setAttribute("aria-expanded", "false");
    }
  });
}
