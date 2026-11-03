import { SAMPLE_PAGES } from "../js/dataset.js";
import { executeSearch, PRESETS } from "../js/rankingEngine.js";

console.log("================================================================================");
console.log("ARCHON '98: ADVERSARIAL LOOPHOLE AUDIT OVER 500 DOCUMENTS");
console.log("================================================================================");

const loopholePages = SAMPLE_PAGES.filter(p => p.id.startsWith("loophole-"));
console.log(`Total loophole-seeking pages evaluated: ${loopholePages.length}\n`);

// Test queries corresponding to the targets of the loophole pages
const testScenarios = [
  { id: "loophole-01", query: "linux operating systems", label: "Extreme Keyword Stuffing" },
  { id: "loophole-02", query: "space telescope astronomy", label: "Viral Viewcounter Bot (5M views)" },
  { id: "loophole-03", query: "unix operating systems benchmarks", label: "Abandoned Tab Dwell Inflation (2 hrs)" },
  { id: "loophole-04", query: "retro computing", label: "Synthetic Link Farm Ring (500 links)" },
  { id: "loophole-05", query: "retro computing", label: "Click-Hijack / 95% CTR Fraud" },
  { id: "loophole-06", query: "web search engine algorithms", label: "Anchor Text Spoofing / Deceptive Title" },
  { id: "loophole-07", query: "linux operating systems", label: "Omni-Topic Splattering" },
  { id: "loophole-08", query: "web standards", label: "Outbound Citation Parasitism" },
  { id: "loophole-09", query: "espresso coffee brewing extraction", label: "Precision Dwell-Time Sweet Spot Bot" },
  { id: "loophole-10", query: "free software gnu", label: "Near-Duplicate Scraper Mirror" },
  { id: "loophole-11", query: "operating systems", label: "Regex Meta-Character & Sanitization Injection" },
  { id: "loophole-12", query: "linux operating systems", label: "Micropage 100% Density (3 words)" },
  { id: "loophole-13", query: "hubble space telescope", label: "Zero-Click / High-Bounce Clickbait Trap" },
  { id: "loophole-14", query: "coffee brewing espresso", label: "Reciprocal Web Ring Inbound Link Stuffing" },
  { id: "loophole-15", query: "retro computing", label: "Hyper-Recent Timestamp / Freshness Manipulation" },
  { id: "loophole-16", query: "c programming language", label: "Single-Letter Acronym Overlap" },
  { id: "loophole-17", query: "cryptography rsa digital privacy", label: "Zero-Traffic Isolated Masterpiece" },
  { id: "loophole-18", query: "open source operating systems", label: "Massive Outbound Link Farm (250 links)" },
  { id: "loophole-19", query: "unix operating systems", label: "Zero-Division / Underflow (0 views, 0s dwell, 0 imps)" },
  { id: "loophole-20", query: "operating systems", label: "Keyword Plural & Suffix Cannibalization" }
];

const auditResults = [];

for (const scenario of testScenarios) {
  // Test under Default Balanced mode
  const balanced = executeSearch(SAMPLE_PAGES, scenario.query, PRESETS.balanced.weights);
  const rankBalanced = balanced.results.findIndex(r => r.page.id === scenario.id) + 1;
  const scoreBalanced = balanced.results.find(r => r.page.id === scenario.id)?.finalScore || 0;
  const topBalancedDoc = balanced.results[0];

  // Test under Pure Keyword mode (AltaVista 1995)
  const keyword = executeSearch(SAMPLE_PAGES, scenario.query, PRESETS.keywordPure.weights);
  const rankKeyword = keyword.results.findIndex(r => r.page.id === scenario.id) + 1;
  const scoreKeyword = keyword.results.find(r => r.page.id === scenario.id)?.finalScore || 0;

  // Test under Crowd Wisdom mode (Popularity & CTR)
  const crowd = executeSearch(SAMPLE_PAGES, scenario.query, PRESETS.crowdWisdom.weights);
  const rankCrowd = crowd.results.findIndex(r => r.page.id === scenario.id) + 1;

  // Test under 1998 Web Graph mode (Link citation)
  const webGraph = executeSearch(SAMPLE_PAGES, scenario.query, PRESETS.webGraph.weights);
  const rankWebGraph = webGraph.results.findIndex(r => r.page.id === scenario.id) + 1;

  auditResults.push({
    ...scenario,
    rankBalanced,
    scoreBalanced,
    rankKeyword,
    scoreKeyword,
    rankCrowd,
    rankWebGraph,
    totalMatches: balanced.totalMatches,
    topDocTitle: topBalancedDoc?.page.title || "None"
  });
}

console.log(JSON.stringify(auditResults, null, 2));
