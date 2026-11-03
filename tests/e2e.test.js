import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("E2E DOM: Full search workflow, ranking sliders, score inspection, and states", async () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, "../index.html"), "utf-8");

  const dom = new JSDOM(htmlContent, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost:3000/"
  });

  const { window } = dom;
  const { document } = window;

  // Mock performance.now in JSDOM if needed
  if (!window.performance) {
    window.performance = { now: () => Date.now() };
  }

  // Load modules
  const { SAMPLE_PAGES } = await import("../js/dataset.js");
  const { executeSearch, PRESETS, DEFAULT_WEIGHTS } = await import("../js/rankingEngine.js");
  const { renderResultCard, bindBreakdownToggles } = await import("../js/ui.js");

  // 1. Initial State Check
  const homeView = document.getElementById("home-view");
  const resultsView = document.getElementById("results-view");
  const homeSearchInput = document.getElementById("home-search-input");
  const homeSearchForm = document.getElementById("home-search-form");
  const resultsList = document.getElementById("results-list");
  const resultsStatsOutput = document.getElementById("results-stats-output");
  const noResultsState = document.getElementById("no-results-state");
  const emptyQueryState = document.getElementById("empty-query-state");

  assert.ok(!homeView.classList.contains("hidden"), "Home view must be visible initially");
  assert.ok(resultsView.classList.contains("hidden"), "Results view must be hidden initially");

  // 2. Perform a search for "retro computing history"
  const query = "retro computing history";
  const outcome = executeSearch(SAMPLE_PAGES, query, PRESETS.balanced.weights);

  assert.ok(outcome.totalMatches >= 3, `Expected at least 3 matches, got ${outcome.totalMatches}`);
  assert.equal(outcome.status, "success");

  // Render cards
  const cardsHtml = outcome.results
    .map((res, idx) => renderResultCard(res, idx, outcome.tokens, query))
    .join("");

  resultsList.innerHTML = cardsHtml;
  bindBreakdownToggles(resultsList);

  homeView.classList.add("hidden");
  resultsView.classList.remove("hidden");

  assert.ok(homeView.classList.contains("hidden"), "Home view hidden after search");
  assert.ok(!resultsView.classList.contains("hidden"), "Results view visible after search");

  // Verify rendered cards
  const renderedCards = resultsList.querySelectorAll(".result-card");
  assert.equal(renderedCards.length, outcome.totalMatches);

  // Check first card details
  const firstCard = renderedCards[0];
  const firstRank = firstCard.querySelector(".rank-badge").textContent;
  assert.equal(firstRank, "#1");

  const titleLink = firstCard.querySelector(".result-title-link");
  assert.ok(titleLink.textContent.trim().length > 0);

  const whyPills = firstCard.querySelectorAll(".why-pill");
  assert.ok(whyPills.length > 0, "Card should display 'Why this result' badges");

  // 3. Test Expand Score Breakdown toggle
  const inspectBtn = firstCard.querySelector(".inspect-toggle-btn");
  assert.ok(inspectBtn, "Must have inspect breakdown button");
  const breakdownDrawer = firstCard.querySelector(".breakdown-drawer");
  assert.ok(breakdownDrawer.classList.contains("hidden"), "Drawer should start hidden");

  // Simulate click
  inspectBtn.click();
  assert.ok(!breakdownDrawer.classList.contains("hidden"), "Drawer should be visible after click");
  assert.equal(inspectBtn.getAttribute("aria-expanded"), "true");
  assert.ok(breakdownDrawer.querySelector(".breakdown-table"), "Must contain breakdown table");

  // Click again to close
  inspectBtn.click();
  assert.ok(breakdownDrawer.classList.contains("hidden"), "Drawer should hide after second click");

  // 4. Test Reranking under different preset (Web Graph vs Pure Keyword)
  const webGraphOutcome = executeSearch(SAMPLE_PAGES, "operating systems", PRESETS.webGraph.weights);
  const keywordOutcome = executeSearch(SAMPLE_PAGES, "operating systems", PRESETS.keywordPure.weights);

  assert.ok(webGraphOutcome.results.length > 0);
  assert.ok(keywordOutcome.results.length > 0);

  // 5. Test No Results State
  const badOutcome = executeSearch(SAMPLE_PAGES, "xyz99nonexistentword", DEFAULT_WEIGHTS);
  assert.equal(badOutcome.status, "no_results");
  assert.equal(badOutcome.results.length, 0);

  // 6. Test Empty Search State
  const emptyOutcome = executeSearch(SAMPLE_PAGES, "", DEFAULT_WEIGHTS);
  assert.equal(emptyOutcome.status, "empty");
  assert.equal(emptyOutcome.results.length, 0);
});

