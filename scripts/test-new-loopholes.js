import { SAMPLE_PAGES } from "../js/dataset.js";
import { executeSearch, PRESETS, calculateRelevance, calculateUserBehavior, calculateLinkScore, tokenize } from "../js/rankingEngine.js";
import { highlightTerms, escapeHtml } from "../js/ui.js";

console.log("================================================================================");
console.log("SEARCHING FOR UNIDENTIFIED & NOVEL LOOPHOLES IN ARCHON '98 (ROUND 2)");
console.log("================================================================================");

const vulnerabilities = [];

// -----------------------------------------------------------------------------
// Vector 1: Ghost Satisfaction Exploit
// -----------------------------------------------------------------------------
const ghostBehavior = calculateUserBehavior(0, 0, 1.0, 0);
if (ghostBehavior.score > 25) {
  vulnerabilities.push({
    vector: "V1: Ghost Satisfaction Exploit",
    detail: `A page with 0 clicks/impressions scores ${ghostBehavior.score}/100 in User Behavior simply by hardcoding satisfactionRate: 1.0`,
    severity: "HIGH"
  });
}

// -----------------------------------------------------------------------------
// Vector 2: Substring Keyword Collision
// -----------------------------------------------------------------------------
const testPageV2 = {
  id: "test-v2",
  title: "General Article About Logic",
  content: "Nothing about felines or unix utility here.",
  keywords: ["concatenation", "telecommunications"],
  topics: ["Computer Science"]
};
const relV2 = calculateRelevance(testPageV2, ["cat"], "cat");
if (relV2.score > 0) {
  vulnerabilities.push({
    vector: "V2: Substring Keyword Collision",
    detail: `Query 'cat' matched keyword 'concatenation' because of substring check (score: ${relV2.score})`,
    severity: "MEDIUM"
  });
}

// -----------------------------------------------------------------------------
// Vector 3: Meta-Tag / Keyword Array Flooding
// -----------------------------------------------------------------------------
const spamKeywords = [
  "linux", "operating", "systems", "kernel", "unix", "retro", "computing",
  "space", "telescope", "astronomy", "hubble", "coffee", "espresso", "brewing",
  "cryptography", "rsa", "security", "privacy", "web", "standards"
];
const testPageV3 = {
  id: "test-v3",
  title: "Totally Irrelevant Kitchen Recipes",
  content: "Today we are baking chocolate chip cookies with sugar, butter, flour, and vanilla extract.",
  keywords: spamKeywords,
  topics: ["Cooking"],
  qualityScore: 0.8,
  views: 5000,
  inboundLinks: 10,
  inboundQuality: 0.8,
  avgTimeOnPage: 120,
  aggregateClicks: 100,
  impressions: 1000,
  satisfactionRate: 0.8
};
const relV3 = calculateRelevance(testPageV3, ["linux", "operating", "systems"], "linux operating systems");
if (relV3.score > 10) {
  vulnerabilities.push({
    vector: "V3: Meta-Tag / Keyword Array Flooding",
    detail: `Page with 0 title and 0 body matches scored ${relV3.score}/100 in relevance by stuffing 20 keywords into metadata`,
    severity: "HIGH"
  });
}

// -----------------------------------------------------------------------------
// Vector 4: Impossible CTR Anomaly / Click Bot Fraud
// -----------------------------------------------------------------------------
const impossibleBehavior = calculateUserBehavior(5000, 100, 0.9, 120);
if (impossibleBehavior.ctr > 100 || impossibleBehavior.score > 50) {
  vulnerabilities.push({
    vector: "V4: Impossible CTR Anomaly / Click Fraud",
    detail: `Fabricated 5000 clicks on 100 impressions yields CTR of ${impossibleBehavior.ctr}% and score ${impossibleBehavior.score}/100`,
    severity: "HIGH"
  });
}

// -----------------------------------------------------------------------------
// Vector 5: Sybil Link Blast without Readership
// -----------------------------------------------------------------------------
const testLinkScore = calculateLinkScore(5000, 0.8, 5, 0.8, 50); // 5,000 links on a page with 50 views
if (testLinkScore.score > 50) {
  vulnerabilities.push({
    vector: "V5: Sybil Link Blast without Readership",
    detail: `Unnatural 5,000 inbound links on 50 views yields link score of ${testLinkScore.score}/100`,
    severity: "MEDIUM"
  });
}

// -----------------------------------------------------------------------------
// Vector 6: Title-Bait Deceptive Sniping (6 title terms, 0 body matches)
// -----------------------------------------------------------------------------
const testPageV6 = {
  id: "test-v6",
  title: "Linux Operating Systems Kernel Architecture Design Guide",
  content: "This page contains 150 words about gardening, flowers, rose bushes, soil ph, fertilizers, watering schedules, sunlight exposure, seasonal pruning, and garden pests with absolutely nothing related to computers.",
  keywords: ["gardening"],
  topics: ["Gardening"],
  qualityScore: 0.8
};
const relV6 = calculateRelevance(testPageV6, ["linux", "operating", "systems"], "linux operating systems");
if (relV6.score > 25) {
  vulnerabilities.push({
    vector: "V6: Title-Bait Deceptive Sniping",
    detail: `Deceptive title with 0 body matches in a 150-word page still scores ${relV6.score}/100 in relevance`,
    severity: "HIGH"
  });
}

// -----------------------------------------------------------------------------
// Vector 7: Single-Letter Technical Query ("c", "c programming")
// -----------------------------------------------------------------------------
const tokensC = tokenize("c programming");
const tokensCOnly = tokenize("c");
if (!tokensC.includes("c") || tokensCOnly.length === 0) {
  vulnerabilities.push({
    vector: "V7: Technical Single-Letter Query Token Drop",
    detail: `Tokenize drops single-letter programming language 'c' (tokenize('c programming') = [${tokensC.join(", ")}], tokenize('c') = [${tokensCOnly.join(", ")}])`,
    severity: "MEDIUM"
  });
}

// -----------------------------------------------------------------------------
// Vector 8: Unicode / Diacritics Mismatch ("café" vs "cafe")
// -----------------------------------------------------------------------------
const tokensCafeAccented = tokenize("café espresso");
const tokensCafePlain = tokenize("cafe espresso");
if (tokensCafeAccented[0] !== tokensCafePlain[0]) {
  vulnerabilities.push({
    vector: "V8: Unicode / Diacritics Stripping Mismatch",
    detail: `Query 'café' tokenizes to '${tokensCafeAccented[0]}' while 'cafe' tokenizes to '${tokensCafePlain[0]}'`,
    severity: "LOW"
  });
}

// -----------------------------------------------------------------------------
// Vector 9: HTML Entity Corruption via Term Highlighting
// -----------------------------------------------------------------------------
const highlightedAmp = highlightTerms("AT&T Bell Labs", ["amp"]);
if (highlightedAmp.includes("&<mark")) {
  vulnerabilities.push({
    vector: "V9: HTML Entity Corruption via Highlight",
    detail: `Query 'amp' corrupted '&amp;' into '${highlightedAmp}'`,
    severity: "HIGH"
  });
}

// -----------------------------------------------------------------------------
// Vector 10: XSS in Malicious Query or Content
// -----------------------------------------------------------------------------
const xssResult = highlightTerms("<script>alert('xss')</script>", ["alert"]);
if (xssResult.includes("<script>")) {
  vulnerabilities.push({
    vector: "V10: XSS Injection in Snippet",
    detail: `Script tag was not escaped in highlight output: '${xssResult}'`,
    severity: "CRITICAL"
  });
}

// -----------------------------------------------------------------------------
// Vector 11: All-Zero Weights Edge Case
// -----------------------------------------------------------------------------
const zeroOutcome = executeSearch(SAMPLE_PAGES, "operating systems", {
  relevance: 0, popularity: 0, engagement: 0, links: 0, behavior: 0, quality: 0
});
for (const r of zeroOutcome.results) {
  if (isNaN(r.finalScore) || !isFinite(r.finalScore)) {
    vulnerabilities.push({
      vector: "V11: All-Zero Weights Math Anomaly",
      detail: `All-zero weights caused NaN or Infinite finalScore: ${r.finalScore}`,
      severity: "CRITICAL"
    });
    break;
  }
}

// -----------------------------------------------------------------------------
// Vector 12: Corrupted/Negative Document Attributes (NaN, -Infinity, null)
// -----------------------------------------------------------------------------
const corruptedDoc = {
  id: "corrupted-test",
  title: "Corrupted Document Attributes",
  content: "Linux operating systems kernel test.",
  views: NaN,
  avgTimeOnPage: -50,
  inboundLinks: null,
  inboundQuality: -2,
  outboundLinks: NaN,
  outboundTrust: 999,
  aggregateClicks: -10,
  impressions: 0,
  qualityScore: NaN,
  freshnessScore: "invalid"
};
const corruptedOutcome = executeSearch([corruptedDoc], "linux operating systems");
if (corruptedOutcome.results.length > 0) {
  const r = corruptedOutcome.results[0];
  if (isNaN(r.finalScore) || !isFinite(r.finalScore) || r.finalScore < 0) {
    vulnerabilities.push({
      vector: "V12: Corrupted Metadata Ingestion Anomaly",
      detail: `Corrupted document metadata resulted in score ${r.finalScore}`,
      severity: "HIGH"
    });
  }
}

console.log(`\nIdentified ${vulnerabilities.length} potential vulnerabilities:\n`);
if (vulnerabilities.length > 0) {
  for (const v of vulnerabilities) {
    console.log(`[${v.severity}] ${v.vector}`);
    console.log(`   -> ${v.detail}\n`);
  }
} else {
  console.log("✔ ALL 12 ADVERSARIAL VECTORS RESOLVED & PASSING WITH ZERO VULNERABILITIES DETECTED.");
}
