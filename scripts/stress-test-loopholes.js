import { SAMPLE_PAGES } from "../js/dataset.js";
import { executeSearch, PRESETS } from "../js/rankingEngine.js";

const QUERIES = [
  "operating systems",
  "linux operating systems",
  "retro computing",
  "computer history",
  "space telescope astronomy",
  "hubble space telescope",
  "espresso coffee brewing extraction",
  "coffee brewing",
  "digital privacy cryptography",
  "cryptography rsa",
  "web search engine algorithms",
  "web standards w3c",
  "free software gnu",
  "unix time sharing",
  "mechanical keyboards",
  "artificial intelligence neural networks",
  "c programming language",
  "tcp ip networking",
  "distributed computing seti",
  "amiga retro computing"
];

const PRESET_KEYS = Object.keys(PRESETS);

console.log("================================================================================");
console.log("EXHAUSTIVE MULTI-QUERY & MULTI-PRESET ADVERSARIAL STRESS TEST");
console.log("================================================================================");

let totalEvaluations = 0;
const loopholesFound = [];

for (const query of QUERIES) {
  for (const presetKey of PRESET_KEYS) {
    const weights = PRESETS[presetKey].weights;
    const outcome = executeSearch(SAMPLE_PAGES, query, weights);
    totalEvaluations++;

    // Check for math anomalies
    for (const r of outcome.results) {
      if (isNaN(r.finalScore) || !isFinite(r.finalScore) || r.finalScore < 0) {
        loopholesFound.push({
          type: "MATH_ANOMALY",
          docId: r.page.id,
          query,
          preset: presetKey,
          score: r.finalScore,
          detail: "Score is NaN, Infinite, or Negative"
        });
      }
    }

    // Inspect top 5 results for any loophole attempts
    const top5 = outcome.results.slice(0, 5);
    top5.forEach((r, idx) => {
      if (r.page.id.startsWith("loophole-")) {
        // Loophole-17 is the isolated legitimate masterpiece (an honest paper testing zero-traffic defense)
        if (r.page.id !== "loophole-17") {
          loopholesFound.push({
            type: "TOP_TIER_BREACH",
            rank: idx + 1,
            docId: r.page.id,
            title: r.page.title,
            query,
            preset: presetKey,
            score: r.finalScore,
            detail: `Loophole page ranked #${idx + 1} under query "${query}" with preset "${presetKey}"`
          });
        }
      }
    });
  }
}

console.log(`Evaluated ${totalEvaluations} query-preset combinations across 500 documents.`);
console.log(`Total loopholes/vulnerabilities detected: ${loopholesFound.length}\n`);

if (loopholesFound.length > 0) {
  console.log("DETAILED VULNERABILITY REPORT:");
  console.log(JSON.stringify(loopholesFound, null, 2));
} else {
  console.log("✔ ZERO LOOPHOLES FOUND: All adversarial pages successfully quarantined across all queries & presets.");
}
