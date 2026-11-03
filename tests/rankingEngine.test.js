import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tokenize,
  calculateRelevance,
  calculatePopularity,
  calculateEngagement,
  calculateLinkScore,
  calculateUserBehavior,
  calculateQualityFreshness,
  executeSearch,
  PRESETS
} from "../js/rankingEngine.js";
import { SAMPLE_PAGES } from "../js/dataset.js";

test("Tokenization cleans punctuation and filters stopwords", () => {
  const tokens = tokenize("What is the Unix operating system in 1998?");
  assert.ok(tokens.includes("unix"));
  assert.ok(tokens.includes("operating"));
  assert.ok(tokens.includes("system"));
  assert.ok(tokens.includes("1998"));
  assert.ok(!tokens.includes("what"));
  assert.ok(!tokens.includes("is"));
  assert.ok(!tokens.includes("the"));
  assert.ok(!tokens.includes("in"));
});

test("Relevance: Title match scores higher than body match", () => {
  const queryTokens = ["linux", "kernel"];
  const pageWithTitle = SAMPLE_PAGES.find(p => p.id === "page-02"); // "Origins of the Linux Kernel"
  const rel1 = calculateRelevance(pageWithTitle, queryTokens, "linux kernel");

  // Synthetic page with match only in body content
  const pageWithContentOnly = {
    title: "Random Tech Musings",
    description: "Various thoughts",
    content: "We installed the linux kernel on an experimental server.",
    keywords: [],
    topics: []
  };
  const rel2 = calculateRelevance(pageWithContentOnly, queryTokens, "linux kernel");

  assert.ok(rel1.score > rel2.score, `Expected title match (${rel1.score}) > content-only match (${rel2.score})`);
  assert.ok(rel1.details.exactPhrase, "Expected exact phrase match bonus to trigger for 'linux kernel'");
});

test("Popularity: Log scaling prevents viral views from overwhelming linear scale", () => {
  const pop10k = calculatePopularity(10000);
  const pop100k = calculatePopularity(100000);
  const pop400k = calculatePopularity(400000);

  // Linear ratio would be 1:10:40. In log scale, difference is bounded and controlled:
  assert.ok(pop10k.score > 40 && pop10k.score < 65, `10k views score was ${pop10k.score}`);
  assert.ok(pop100k.score > 70 && pop100k.score < 85, `100k views score was ${pop100k.score}`);
  assert.ok(pop400k.score >= 90, `400k views score was ${pop400k.score}`);
  // 400k score is less than double 10k score, preventing viral skew
  assert.ok(pop400k.score < pop10k.score * 2.0);
});

test("Engagement safeguard: Active 240s reading scores higher than 1800s abandoned/idle tab", () => {
  const rapidBounce = calculateEngagement(14); // 14s bounce
  const activeRead = calculateEngagement(240); // 4m active reading
  const idleTab = calculateEngagement(1800);   // 30m abandoned tab

  assert.ok(rapidBounce.score < 30, `Rapid bounce should be severely penalized (<30), got ${rapidBounce.score}`);
  assert.ok(activeRead.score >= 90, `Active 240s read should be in peak zone (>=90), got ${activeRead.score}`);
  assert.ok(idleTab.score < activeRead.score, `Idle tab (${idleTab.score}) should NOT outscore active read (${activeRead.score})!`);
  assert.equal(idleTab.category, "Idle / Abandoned Tab Safeguard (>10m)");
});

test("Link signals: High inbound citation count with high trust outscores link farms", () => {
  const authoritative = calculateLinkScore(64, 0.98, 15, 0.92);
  const linkFarm = calculateLinkScore(5, 0.25, 45, 0.20);

  assert.ok(authoritative.score > 75, `Authoritative score was ${authoritative.score}`);
  assert.ok(linkFarm.score < 30, `Link farm score was ${linkFarm.score}`);
});

test("Search execution: Balanced mode suppresses clickbait compared to Pure Keyword mode", () => {
  const query = "retro computing";

  // In Balanced mode (default), page-03 (Stanford museum) or page-04 (Amiga) should beat page-19 (clickbait spam)
  const balancedResults = executeSearch(SAMPLE_PAGES, query, PRESETS.balanced.weights);
  assert.ok(balancedResults.totalMatches > 0);

  const topBalanced = balancedResults.results[0];
  const clickbaitInBalanced = balancedResults.results.find(r => r.page.id === "page-19");

  assert.notEqual(topBalanced.page.id, "page-19", "Clickbait page-19 should NOT be #1 in balanced mode!");
  assert.ok(topBalanced.finalScore > clickbaitInBalanced.finalScore, "Legitimate page must outrank clickbait in balanced mode");

  // Clickbait page-19 is completely suppressed by anti-spam and clickbait defenses
  const keywordResults = executeSearch(SAMPLE_PAGES, query, PRESETS.keywordPure.weights);
  const clickbaitInKeyword = keywordResults.results.find(r => r.page.id === "page-19");
  assert.ok(topBalanced.finalScore > clickbaitInKeyword.finalScore, "Legitimate page must vastly outscore clickbait in both modes");
  assert.ok(clickbaitInKeyword.finalScore < 25, "Clickbait page should be severely penalized (< 25)");
});

test("Search execution: Web Graph preset elevates heavily cited Stanford web crawler paper", () => {
  const query = "web search engine";
  const webGraphResults = executeSearch(SAMPLE_PAGES, query, PRESETS.webGraph.weights);
  const topResult = webGraphResults.results[0];
  // Page 11 is the Stanford Anatomy paper with 85 inbound links and 0.99 authority
  assert.equal(topResult.page.id, "page-11", "Stanford Anatomy paper should rank #1 under Web Graph preset");
});

test("Search execution handles empty queries and unmatched queries gracefully", () => {
  const emptyRes = executeSearch(SAMPLE_PAGES, "");
  assert.equal(emptyRes.status, "empty");
  assert.equal(emptyRes.results.length, 0);

  const noMatchesRes = executeSearch(SAMPLE_PAGES, "xyz999nonexistentwordqwert");
  assert.equal(noMatchesRes.status, "no_results");
  assert.equal(noMatchesRes.results.length, 0);
});

