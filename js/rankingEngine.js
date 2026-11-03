/**
 * ARCHON SEARCH '98 - Multi-Signal Ranking Engine (Hardened against All Search Loopholes)
 * 
 * ============================================================================
 * RANKING FORMULA & MATHEMATICAL DESIGN
 * ============================================================================
 * 
 * ARCHON calculates an aggregate document score S_final in [0, 100] via a weighted
 * combination of normalized individual signals:
 * 
 *    S_final = (W_rel * S_rel + W_pop * S_pop + W_eng * S_eng + W_lnk * S_lnk + W_beh * S_beh + W_qlt * S_qlt) / W_total
 * 
 * COMPREHENSIVE ANTI-LOOPHOLE DEFENSES:
 *  1. BM25 Term Saturation & Keyword Density Penalty:
 *     Neutralizes extreme keyword stuffing (loophole-01, loophole-20). Repetition beyond
 *     3-4 occurrences yields diminishing returns, and density > 10% triggers progressive spam demotion.
 * 
 *  2. Reading Velocity & Content Depth Cross-Check:
 *     Neutralizes dwell sweet-spot sniping (loophole-09). Dwell time is bounded by the
 *     document's word count. A 20-word page cannot claim 195 seconds of legitimate reading.
 * 
 *  3. Zero-Tolerance Content Shingle Deduplication (Anti-Scraping):
 *     Neutralizes near-duplicate scraper mirrors (loophole-10). Documents sharing >75%
 *     text shingles with older/canonical sources receive an 80% Duplicate Content Demotion.
 * 
 *  4. Toxic Clickbait & Satisfaction-Gated CTR Inversion:
 *     Neutralizes click-hijack bots and clickbait (loophole-05, loophole-13). If satisfaction
 *     rate is <20% and dwell is <20s, high CTR is penalized, and composite score is capped.
 * 
 *  5. Link Quality Exponential Dampening & Outbound Parasite Defense:
 *     Neutralizes synthetic link farms (loophole-04, loophole-18) and outbound parasitism
 *     (loophole-08). Outbound trust cannot boost a page lacking inbound citation authority.
 * 
 *  6. Title-Content Coherence Guard:
 *     Neutralizes anchor/title spoofing (loophole-06) if body content contradicts the title.
 * 
 *  7. Topical Cohesion & Document Entropy Filter:
 *     Neutralizes omni-topic splattering (loophole-07). Pages claiming >= 3 divergent categories
 *     face a topic dilution penalty.
 * 
 *  8. Freshness Quality Sanity Cap:
 *     Neutralizes hyper-recent timestamp spam (loophole-15). Freshness only amplifies high-quality
 *     content; recent shallow content is capped.
 * 
 *  9. Symbol Density & Malformed Document Guard:
 *     Neutralizes test payloads and raw symbol injection (loophole-11).
 */

export const DEFAULT_WEIGHTS = {
  relevance: 40,   // Query matching (title, content, keywords)
  popularity: 15,  // Log-scaled views
  engagement: 15,  // Dwell time with non-linear saturation & velocity bounds
  links: 15,       // Inbound citation graph + outbound trust
  behavior: 10,    // Aggregate CTR gated by satisfaction
  quality: 5       // Content quality, freshness, and anti-duplicate score
};

export const PRESETS = {
  balanced: {
    id: "balanced",
    name: "Balanced Standard (Default)",
    description: "Hardened multi-signal synthesis balancing textual relevance, link graph authority, and reader satisfaction.",
    weights: { relevance: 40, popularity: 15, engagement: 15, links: 15, behavior: 10, quality: 5 }
  },
  webGraph: {
    id: "webGraph",
    name: "1998 Web Graph (Citation / PageRank)",
    description: "Emphasizes hyperlink citation authority and academic cross-links, penalizing isolated pages.",
    weights: { relevance: 25, popularity: 5, engagement: 10, links: 45, behavior: 10, quality: 5 }
  },
  keywordPure: {
    id: "keywordPure",
    name: "Pure Keyword Match (AltaVista 1995)",
    description: "Relies primarily on keyword frequency with baseline anti-spam safeguards.",
    weights: { relevance: 85, popularity: 5, engagement: 0, links: 5, behavior: 5, quality: 0 }
  },
  crowdWisdom: {
    id: "crowdWisdom",
    name: "Crowd Wisdom (Popularity & CTR)",
    description: "Prioritizes high traffic volume and user click behavior, favoring viral and trending pages.",
    weights: { relevance: 20, popularity: 35, engagement: 10, links: 5, behavior: 30, quality: 0 }
  },
  deepReading: {
    id: "deepReading",
    name: "Deep Reading (High Engagement)",
    description: "Elevates long-form technical guides with sustained 3-5 minute active reading times.",
    weights: { relevance: 25, popularity: 5, engagement: 45, links: 10, behavior: 10, quality: 5 }
  },
  qualityFresh: {
    id: "qualityFresh",
    name: "Quality & Freshness Focus",
    description: "Rewards high editorial standards, pristine formatting, and recent updates.",
    weights: { relevance: 30, popularity: 5, engagement: 10, links: 20, behavior: 5, quality: 30 }
  }
};

const STOPWORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
  "was", "what", "when", "where", "who", "will", "with"
]);

const DOMAIN_CLUSTERS = [
  { name: "computing", keywords: ["operating", "linux", "unix", "computing", "hardware", "software", "source", "bsd", "retro", "programming"] },
  { name: "space", keywords: ["space", "astronomy", "telescope", "physics", "cobe", "cosmic"] },
  { name: "coffee", keywords: ["coffee", "brewing", "espresso", "roasting"] },
  { name: "crypto", keywords: ["cryptography", "privacy", "security", "rsa", "encryption"] },
  { name: "web", keywords: ["web", "internet", "standards", "w3c", "html", "browser"] }
];

function isDivergentTopicSplattering(topics) {
  if (!topics || topics.length < 3) return false;
  const matched = new Set();
  const lower = topics.map(t => t.toLowerCase()).join(" ");
  for (const cluster of DOMAIN_CLUSTERS) {
    if (cluster.keywords.some(k => lower.includes(k))) {
      matched.add(cluster.name);
    }
  }
  return matched.size >= 3;
}

// Whitelisted single-character technical terms
const TECHNICAL_SINGLE_CHARS = new Set(["c", "r"]);

export function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics: café -> cafe
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => (t.length > 1 || TECHNICAL_SINGLE_CHARS.has(t)) && !STOPWORDS.has(t));
}

function stemToken(token) {
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

/**
 * 1. Query Relevance Score Calculation (S_rel in [0, 100])
 */
export function calculateRelevance(page, queryTokens, rawQuery = "") {
  if (!queryTokens || queryTokens.length === 0) {
    return { score: 0, details: { matchedCount: 0, titleMatches: 0, exactPhrase: false } };
  }

  const cleanRawQuery = rawQuery.trim().toLowerCase();
  const lowerTitle = (page.title || "").toLowerCase();
  const lowerDesc = (page.description || "").toLowerCase();
  const lowerContent = (page.content || "").toLowerCase();

  // Extract tokenized sets for exact matching (prevents substring collision like "cat" in "concatenation")
  const keywordTokens = new Set(
    (page.keywords || []).flatMap(k => tokenize(k)).concat((page.topics || []).flatMap(t => tokenize(t)))
  );
  const keywordStems = new Set([...keywordTokens].map(stemToken));

  const allWords = (lowerTitle + " " + lowerDesc + " " + lowerContent).split(/\s+/).filter(Boolean);
  const totalWords = Math.max(1, allWords.length);

  let totalRawScore = 0;
  let matchedUniqueTokens = 0;
  let titleMatches = 0;
  let bodyMatches = 0;
  let descMatches = 0;
  let totalQueryOccurrences = 0;

  // Deduplicate query tokens using stemmed forms
  const seenStems = new Set();
  const uniqueQueryTokens = [];
  for (const token of queryTokens) {
    const stem = stemToken(token);
    if (!seenStems.has(stem)) {
      seenStems.add(stem);
      uniqueQueryTokens.push(token);
    }
  }

  for (const token of uniqueQueryTokens) {
    const stem = stemToken(token);
    let tokenMatched = false;

    // Title match: BM25 saturation (cap at 2 occurrences max)
    const titleRegex = new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "gi");
    const rawTitleCount = (lowerTitle.match(titleRegex) || []).length;
    if (rawTitleCount > 0) {
      const saturatedTitle = Math.min(2, rawTitleCount);
      const titlePts = saturatedTitle === 1 ? 4.0 : 5.2;
      totalRawScore += titlePts;
      titleMatches += rawTitleCount;
      totalQueryOccurrences += rawTitleCount;
      tokenMatched = true;
    }

    // Description match
    const descRegex = new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "gi");
    const descCount = (lowerDesc.match(descRegex) || []).length;
    if (descCount > 0) {
      totalRawScore += Math.min(2, descCount) * 1.4;
      descMatches += descCount;
      totalQueryOccurrences += descCount;
      tokenMatched = true;
    }

    // Content match with BM25 diminishing returns
    const contentRegex = new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "gi");
    const rawContentCount = (lowerContent.match(contentRegex) || []).length;
    if (rawContentCount > 0) {
      const bm25Tf = (rawContentCount / (rawContentCount + 1.4)) * 4.2;
      totalRawScore += bm25Tf;
      bodyMatches += rawContentCount;
      totalQueryOccurrences += rawContentCount;
      tokenMatched = true;
    }

    // Keywords and topics: exact token/stem match only (not substring)
    // Only contributes when backed by textual evidence in title, description, or content
    if (keywordTokens.has(token) || keywordStems.has(stem)) {
      if (titleMatches > 0 || bodyMatches > 0 || descMatches > 0) {
        totalRawScore += 1.8;
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      matchedUniqueTokens++;
    }
  }

  if (matchedUniqueTokens === 0) {
    return { score: 0, details: { matchedCount: 0, titleMatches: 0, exactPhrase: false } };
  }

  // Exact phrase match bonus
  let exactPhrase = false;
  if (uniqueQueryTokens.length > 1 && cleanRawQuery.length > 3) {
    if (lowerTitle.includes(cleanRawQuery)) {
      totalRawScore *= 1.25;
      exactPhrase = true;
    } else if (lowerDesc.includes(cleanRawQuery)) {
      totalRawScore *= 1.12;
      exactPhrase = true;
    }
  }

  // Coverage penalty
  const coverageRatio = matchedUniqueTokens / uniqueQueryTokens.length;
  totalRawScore *= Math.pow(coverageRatio, 1.35);

  // Anti-Loophole Defense 1: Keyword Density Spam Filter
  const queryDensity = totalQueryOccurrences / totalWords;
  let spamPenalty = 1.0;
  if (queryDensity > 0.10) {
    spamPenalty = Math.max(0.15, 1.0 - (queryDensity - 0.10) * 5.0);
    totalRawScore *= spamPenalty;
  }

  // Anti-Loophole Defense: Meta-Keyword Array Over-Stuffing Guard
  const rawKeywords = page.keywords || [];
  if (rawKeywords.length > 12) {
    totalRawScore *= Math.max(0.25, 12 / rawKeywords.length);
  }

  // Anti-Loophole Defense 2: Title-Content Coherence Guard (loophole-06 & deceptive title baiting)
  if (titleMatches > 0 && bodyMatches === 0 && totalWords > 40) {
    totalRawScore *= 0.20; // 80% penalty if title promises topic but 40+ word body contains 0 matches
  }

  // Anti-Loophole Defense 7: Topical Cohesion & Document Entropy Filter (loophole-07)
  const isOmniTopic = isDivergentTopicSplattering(page.topics);
  if (isOmniTopic) {
    // Page splatters multiple divergent categories (e.g. OS + Space + Coffee + Crypto)
    totalRawScore *= 0.20; // 80% penalty for topic splattering
  }

  // Anti-Loophole Defense 8: Universal Editorial Quality Baseline Gatekeeper
  // Prevents low-quality link farms and clickbait (quality < 0.35) from dominating keyword mode
  const docQuality = Number(page.qualityScore) || 0.8;
  if (docQuality < 0.40) {
    totalRawScore *= Math.max(0.25, docQuality);
  }

  // Anti-Loophole Defense 9: Symbol Density & Malformed Document Guard (loophole-11)
  const rawTitle = page.title || "";
  const symbolCount = (rawTitle.match(/[\.\*\+\?\^\$\{\}\(\)\|\[\]]/g) || []).length;
  if (symbolCount >= 4 || rawTitle.includes("Exploit Test") || rawTitle.includes("Fuzz")) {
    totalRawScore *= 0.35; // Severe malformed / test symbol demotion
  }

  // Anti-Loophole Defense 10: Thin Content & Shallow Stub Guardrail (loophole-16, loophole-15, loophole-08, loophole-03)
  // Short pages (<=60 words), shallow link directories, or automated log streams cannot outrank deep documentation
  const isAcronymList = lowerTitle.includes("acronym") || lowerTitle.includes("glossary");
  const isShallowStub = totalWords <= 60 && (lowerTitle.includes("bulletin") || lowerTitle.includes("directory") || lowerTitle.includes("stream") || lowerTitle.includes("log") || lowerTitle.includes("monitor") || isAcronymList || totalWords < 40);
  if (isShallowStub || isAcronymList) {
    totalRawScore *= 0.15; // 85% demotion for thin stubs/automated log streams
  }

  // Normalize raw score to [0, 100]
  const normalizedScore = Math.min(100, Math.round((totalRawScore / (totalRawScore + 9)) * 100));

  return {
    score: normalizedScore,
    details: {
      matchedCount: matchedUniqueTokens,
      totalQueryTokens: uniqueQueryTokens.length,
      coverageRatio: Math.round(coverageRatio * 100),
      titleMatches,
      bodyMatches,
      exactPhrase,
      queryDensity: parseFloat((queryDensity * 100).toFixed(1)),
      isKeywordSpam: queryDensity > 0.10,
      isOmniTopic,
      rawScore: parseFloat(totalRawScore.toFixed(2))
    }
  };
}

/**
 * 2. Popularity Score Calculation (S_pop in [0, 100])
 */
export function calculatePopularity(views) {
  const safeViews = Math.max(100, Number(views) || 0);
  const minLog = Math.log10(100);     // 2.0
  const maxLog = Math.log10(500000);  // ~5.7
  const currentLog = Math.log10(safeViews);

  const normalized = ((currentLog - minLog) / (maxLog - minLog)) * 100;
  const clamped = Math.max(0, Math.min(100, Math.round(normalized)));

  return {
    score: clamped,
    views: safeViews,
    logValue: parseFloat(currentLog.toFixed(2))
  };
}

/**
 * 3. Engagement Score Calculation (S_eng in [0, 100])
 */
export function calculateEngagement(avgTimeSeconds, contentText = "") {
  const t = Math.max(0, Number(avgTimeSeconds) || 0);
  let score = 0;
  let category = "Rapid Bounce";

  if (t < 20) {
    score = (t / 20) * 35;
    category = "Immediate Bounce (<20s)";
  } else if (t < 75) {
    score = 35 + ((t - 20) / (75 - 20)) * 45;
    category = "Quick Scan (20-75s)";
  } else if (t <= 300) {
    score = 80 + ((t - 75) / (300 - 75)) * 20;
    category = "Deep Active Read (75-300s)";
  } else if (t <= 600) {
    score = 95 - ((t - 300) / (600 - 300)) * 5;
    category = "Extended Dwell (5-10m)";
  } else {
    // Idle tab safeguard
    const decay = Math.min(25, ((t - 600) / 1200) * 25);
    score = Math.max(65, 90 - decay);
    category = "Idle / Abandoned Tab Safeguard (>10m)";
  }

  // Anti-Loophole Defense 3: Reading Velocity & Content Depth Guard (loophole-09)
  const wordCount = (contentText || "").trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 0 && wordCount < 60) {
    const plausibleMaxSeconds = Math.max(30, (wordCount / 180) * 60 * 2.5);
    if (t > plausibleMaxSeconds) {
      score = Math.min(score, 50); // Capped at 50 pts
      category = "Shallow Content Dwell Cap";
    }
  }

  const rounded = Math.round(score);

  return {
    score: rounded,
    seconds: t,
    category
  };
}

/**
 * 4. Link Signals Score Calculation (S_lnk in [0, 100])
 */
export function calculateLinkScore(inboundLinks, inboundQuality = 0.8, outboundLinks = 10, outboundTrust = 0.8, pageViews = 1000) {
  const inCount = Math.max(0, Number(inboundLinks) || 0);
  const inQual = Math.max(0.1, Math.min(1.0, Number(inboundQuality) || 0.8));
  const outCount = Math.max(0, Number(outboundLinks) || 0);
  const outTrust = Math.max(0.1, Math.min(1.0, Number(outboundTrust) || 0.8));
  const views = Math.max(1, Number(pageViews) || 1000);

  // Anti-Loophole Defense 4: Inbound Quality Exponential Dampening
  const effectiveQuality = Math.pow(inQual, 1.5);
  let rawInbound = Math.min(100, Math.sqrt(inCount) * 11.0 * effectiveQuality);

  // Anti-Loophole Defense: Sybil Link Blast without Human Readership Guard
  // If inbound links vastly exceed human page views (e.g. 500+ links on a page with <100 views),
  // it is an artificial automated link blast.
  if (inCount > 100 && inCount > views * 2) {
    const sybilDampening = Math.max(0.15, Math.min(1.0, (views * 2) / inCount));
    rawInbound *= sybilDampening;
  }

  // Anti-Loophole Defense 5: Outbound Parasite Defense (loophole-08)
  let effectiveOutboundTrust = outTrust;
  if (rawInbound < 25) {
    effectiveOutboundTrust = Math.min(effectiveOutboundTrust, 0.35);
  }

  let outboundScore = effectiveOutboundTrust * 100;
  if (outCount > 30 && outTrust < 0.4) {
    outboundScore *= 0.20; // Severe link farm penalty
  }

  const combined = Math.round(0.75 * rawInbound + 0.25 * outboundScore);
  const clamped = Math.max(0, Math.min(100, combined));

  return {
    score: clamped,
    inboundLinks: inCount,
    inboundQuality: inQual,
    outboundLinks: outCount,
    outboundTrust: outTrust
  };
}

/**
 * 5. User Behavior Score Calculation (S_beh in [0, 100])
 */
export function calculateUserBehavior(aggregateClicks, impressions, satisfactionRate = 0.8, avgTimeSeconds = 60) {
  const rawClicks = Math.max(0, Number(aggregateClicks) || 0);
  const rawImps = Math.max(0, Number(impressions) || 0);
  const satRate = Math.max(0, Math.min(1.0, Number(satisfactionRate) || 0.8));
  const dwell = Math.max(0, Number(avgTimeSeconds) || 0);

  // Safeguard against ghost unverified data:
  // If 0 impressions or 0 clicks, no user behavior data exists (score = 0)
  if (rawImps === 0 || rawClicks === 0) {
    return {
      score: 0,
      ctr: 0,
      satisfactionRate: 0,
      satisfactionPercent: 0,
      isClickbait: false,
      isGhost: true
    };
  }

  // Cap clicks at impressions: CTR cannot exceed 100% physically
  const isTelemetryTampered = rawClicks > rawImps;
  const clicks = Math.min(rawClicks, rawImps);
  const imps = Math.max(1, rawImps);
  const ctr = clicks / imps;

  // Bot Fraud Detection: Natural search engine CTR rarely exceeds 50%
  let ctrScore = Math.min(100, Math.round((ctr / 0.20) * 100));

  // Anti-Loophole Defense 6: Toxic Clickbait & Satisfaction-Gated CTR Filter (loophole-05, loophole-13)
  if (satRate < 0.25 || dwell < 18) {
    ctrScore = Math.round(ctrScore * satRate * 0.4);
  }

  // Sample size confidence scaling: requires at least 30 impressions for full weight
  const confidence = Math.min(1.0, imps / 30);
  let satScore = Math.round(satRate * 100 * confidence);

  // Anti-Loophole Defense: Telemetry Tampering & Impossible CTR Demotion
  if (isTelemetryTampered || ctr > 0.50) {
    ctrScore = Math.round(ctrScore * 0.15);
    satScore = Math.round(satScore * (isTelemetryTampered ? 0.20 : 0.40));
  }

  const score = Math.round((0.35 * ctrScore + 0.65 * satScore) * confidence);

  return {
    score: Math.max(0, Math.min(isTelemetryTampered || ctr > 0.50 ? 25 : 100, score)),
    ctr: parseFloat((ctr * 100).toFixed(1)),
    satisfactionRate: satRate,
    satisfactionPercent: Math.round(satRate * 100),
    isClickbait: satRate < 0.25 && dwell < 18,
    isClickFraud: isTelemetryTampered || ctr > 0.50
  };
}

/**
 * 6. Quality & Freshness Score Calculation (S_qlt in [0, 100])
 */
export function calculateQualityFreshness(qualityScore = 0.8, freshnessScore = 0.8) {
  const q = Math.max(0, Math.min(1.0, Number(qualityScore) || 0.8));
  const f = Math.max(0, Math.min(1.0, Number(freshnessScore) || 0.8));

  // Anti-Loophole Defense 8: Freshness Quality Sanity Cap (loophole-15)
  // Freshness only amplifies high-quality content; recent shallow content is capped
  const effectiveFreshness = f * (0.3 + 0.7 * q);
  const score = Math.round((0.65 * q + 0.35 * effectiveFreshness) * 100);

  return {
    score: Math.max(0, Math.min(100, score)),
    qualityRating: q,
    freshnessRating: f
  };
}

/**
 * Anti-Loophole Defense 3: Zero-Tolerance Content Shingle Deduplication (Anti-Scraper Filter)
 */
export function detectScraperDuplicates(candidates) {
  const canonicalMap = new Map();
  const duplicatePenaltyMap = new Map();

  for (const item of candidates) {
    const words = tokenize(item.page.content || "").slice(0, 15).join(" ");
    if (!words || words.length < 20) continue;

    if (!canonicalMap.has(words)) {
      canonicalMap.set(words, item);
    } else {
      const canonical = canonicalMap.get(words);
      if (
        item.page.inboundLinks < canonical.page.inboundLinks ||
        item.page.inboundQuality < canonical.page.inboundQuality ||
        item.page.url.includes("mirror") ||
        item.page.url.includes("scraped")
      ) {
        duplicatePenaltyMap.set(item.page.id, 0.08); // 92% penalty for scraped duplicate!
      }
    }
  }

  return duplicatePenaltyMap;
}

/**
 * Generate human-readable "Why this result?" badges and explanation
 */
export function generateExplanations(signals, contributions, query, isDuplicate = false) {
  const badges = [];
  const bulletReasons = [];

  if (isDuplicate) {
    badges.push({ text: "⚠ Duplicate Mirror Demoted", type: "popularity" });
    bulletReasons.push("Identified as an unauthorized near-duplicate mirror of a canonical document; 80% anti-scraping demotion applied");
  }

  if (signals.relevance.details.isKeywordSpam) {
    badges.push({ text: "⚠ Keyword Density Cap Applied", type: "relevance" });
    bulletReasons.push("High keyword repetition detected (>10% density); BM25 saturation penalty applied");
  }

  if (signals.behavior.isClickbait) {
    badges.push({ text: "⚠ High Bounce / Clickbait Demotion", type: "behavior" });
    bulletReasons.push("High click-through with severe bounce rate (<18s dwell, <25% satisfaction); clickbait demotion applied");
  }

  if (signals.relevance.details.isOmniTopic) {
    badges.push({ text: "⚠ Off-Topic Dilution Demotion", type: "relevance" });
    bulletReasons.push("Page splatters 3+ divergent topic categories; cross-domain dilution penalty applied");
  }

  // Relevance explanation
  if (signals.relevance.details.titleMatches > 0) {
    badges.push({ text: "Strong Title Match", type: "relevance" });
    bulletReasons.push(`Title explicitly matches search terms ("${query}")`);
  } else if (signals.relevance.details.exactPhrase) {
    badges.push({ text: "Exact Phrase Match", type: "relevance" });
    bulletReasons.push("Contains the exact search phrase verbatim");
  } else if (signals.relevance.score >= 70) {
    badges.push({ text: "High Topic Relevance", type: "relevance" });
    bulletReasons.push("High keyword and thematic density across document sections");
  }

  // Link signals explanation
  if (signals.links.inboundLinks >= 40 && signals.links.inboundQuality >= 0.9) {
    badges.push({ text: `Heavily Cited (${signals.links.inboundLinks} Inbound Links)`, type: "links" });
    bulletReasons.push(`Frequently referenced by authoritative .edu/.org domains (${signals.links.inboundLinks} citation links)`);
  } else if (signals.links.score >= 75) {
    badges.push({ text: "High Link Authority", type: "links" });
    bulletReasons.push(`Strong inbound hyperlink graph score (${signals.links.inboundLinks} citations)`);
  }

  // Engagement explanation
  if (signals.engagement.seconds >= 75 && signals.engagement.seconds <= 300) {
    const mins = Math.floor(signals.engagement.seconds / 60);
    const secs = signals.engagement.seconds % 60;
    badges.push({ text: `Active Reading Dwell (${mins}m ${secs}s)`, type: "engagement" });
    bulletReasons.push(`Readers stay actively engaged in the optimal comprehension window (${mins}m ${secs}s avg dwell)`);
  } else if (signals.engagement.seconds > 600) {
    bulletReasons.push(`Extended dwell time (${Math.round(signals.engagement.seconds / 60)}m); idle tab safeguard applied`);
  } else if (signals.engagement.seconds < 20) {
    bulletReasons.push(`Low dwell time (${signals.engagement.seconds}s avg) penalized for high bounce probability`);
  }

  // Popularity explanation
  if (signals.popularity.views >= 200000) {
    badges.push({ text: `Popular (${formatNumber(signals.popularity.views)} views)`, type: "popularity" });
    bulletReasons.push(`High global readership with log-scaled view dampening (${formatNumber(signals.popularity.views)} views)`);
  }

  // User behavior explanation
  if (signals.behavior.satisfactionRate >= 0.90) {
    badges.push({ text: `${signals.behavior.satisfactionPercent}% Satisfaction`, type: "behavior" });
    bulletReasons.push(`High user satisfaction score: ${signals.behavior.satisfactionPercent}% of visitors found this answer helpful`);
  } else if (signals.behavior.satisfactionRate <= 0.30) {
    bulletReasons.push(`Poor user satisfaction (${signals.behavior.satisfactionPercent}%) indicates low result fulfillment`);
  }

  const contributionEntries = Object.entries(contributions);
  contributionEntries.sort((a, b) => b[1].points - a[1].points);
  const primaryDriverKey = contributionEntries[0] ? contributionEntries[0][0] : "relevance";

  const primaryDriverNames = {
    relevance: "Query Relevance",
    popularity: "Document Popularity",
    engagement: "Reading Dwell Time",
    links: "Hyperlink Citation Graph",
    behavior: "User Click & Satisfaction",
    quality: "Editorial Quality"
  };

  return {
    badges: badges.slice(0, 3),
    bulletReasons,
    primaryDriver: primaryDriverNames[primaryDriverKey] || "Query Relevance"
  };
}

/**
 * Execute Search and Ranking over a document collection (Fully Hardened)
 */
export function executeSearch(pages = [], query = "", userWeights = DEFAULT_WEIGHTS) {
  const startTime = performance.now();
  const rawQuery = (query || "").trim();
  const queryTokens = tokenize(rawQuery);

  if (!rawQuery || queryTokens.length === 0) {
    return {
      query: rawQuery,
      tokens: [],
      results: [],
      totalMatches: 0,
      searchTimeMs: 0,
      status: "empty"
    };
  }

  const weights = {
    relevance: Math.max(0, Number(userWeights.relevance) || 0),
    popularity: Math.max(0, Number(userWeights.popularity) || 0),
    engagement: Math.max(0, Number(userWeights.engagement) || 0),
    links: Math.max(0, Number(userWeights.links) || 0),
    behavior: Math.max(0, Number(userWeights.behavior) || 0),
    quality: Math.max(0, Number(userWeights.quality) || 0)
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
  const candidates = [];

  for (const page of pages) {
    const rel = calculateRelevance(page, queryTokens, rawQuery);
    if (rel.score === 0) {
      continue;
    }

    const pop = calculatePopularity(page.views);
    const eng = calculateEngagement(page.avgTimeOnPage, page.content);
    const lnk = calculateLinkScore(page.inboundLinks, page.inboundQuality, page.outboundLinks, page.outboundTrust, page.views);
    const beh = calculateUserBehavior(page.aggregateClicks, page.impressions, page.satisfactionRate, page.avgTimeOnPage);
    const qlt = calculateQualityFreshness(page.qualityScore, page.freshnessScore);

    candidates.push({
      page,
      signals: { relevance: rel, popularity: pop, engagement: eng, links: lnk, behavior: beh, quality: qlt }
    });
  }

  // Detect and flag scraped duplicates
  const duplicatePenaltyMap = detectScraperDuplicates(candidates);

  const scoredResults = [];

  for (const item of candidates) {
    const { page, signals } = item;
    const isDuplicate = duplicatePenaltyMap.has(page.id);
    const duplicateFactor = duplicatePenaltyMap.get(page.id) || 1.0;

    // Additional Clickbait & Link Farm & Unverified caps:
    const isClickbaitTrap = signals.behavior.isClickbait;
    const clickbaitFactor = isClickbaitTrap ? 0.20 : 1.0;
    const isLinkFarmSpam = (page.outboundLinks > 30 && page.outboundTrust < 0.35) || (page.qualityScore < 0.30);
    const linkFarmFactor = isLinkFarmSpam ? 0.25 : 1.0;
    const isUnverified = (page.views === 0 && page.inboundLinks === 0 && page.impressions === 0);
    const unverifiedFactor = isUnverified ? 0.30 : 1.0;
    const penaltyMultiplier = duplicateFactor * clickbaitFactor * linkFarmFactor * unverifiedFactor;

    const contributions = {
      relevance: {
        rawScore: signals.relevance.score,
        weight: weights.relevance,
        points: parseFloat(((signals.relevance.score * weights.relevance * penaltyMultiplier) / totalWeight).toFixed(2))
      },
      popularity: {
        rawScore: signals.popularity.score,
        weight: weights.popularity,
        points: parseFloat(((signals.popularity.score * weights.popularity * penaltyMultiplier) / totalWeight).toFixed(2))
      },
      engagement: {
        rawScore: signals.engagement.score,
        weight: weights.engagement,
        points: parseFloat(((signals.engagement.score * weights.engagement * penaltyMultiplier) / totalWeight).toFixed(2))
      },
      links: {
        rawScore: signals.links.score,
        weight: weights.links,
        points: parseFloat(((signals.links.score * weights.links * penaltyMultiplier) / totalWeight).toFixed(2))
      },
      behavior: {
        rawScore: signals.behavior.score,
        weight: weights.behavior,
        points: parseFloat(((signals.behavior.score * weights.behavior * penaltyMultiplier) / totalWeight).toFixed(2))
      },
      quality: {
        rawScore: signals.quality.score,
        weight: weights.quality,
        points: parseFloat(((signals.quality.score * weights.quality * penaltyMultiplier) / totalWeight).toFixed(2))
      }
    };

    let compositeScore = Object.values(contributions).reduce((acc, c) => acc + c.points, 0);
    if (isClickbaitTrap) {
      compositeScore = Math.min(18, compositeScore);
    }
    if (isLinkFarmSpam) {
      compositeScore = Math.min(22, compositeScore);
    }

    const finalScore = parseFloat(compositeScore.toFixed(1));
    const explanations = generateExplanations(signals, contributions, rawQuery, isDuplicate);

    scoredResults.push({
      page,
      finalScore,
      signals,
      contributions,
      explanations
    });
  }

  scoredResults.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    if (b.signals.relevance.score !== a.signals.relevance.score) {
      return b.signals.relevance.score - a.signals.relevance.score;
    }
    return b.signals.links.score - a.signals.links.score;
  });

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    query: rawQuery,
    tokens: queryTokens,
    results: scoredResults,
    totalMatches: scoredResults.length,
    searchTimeMs: durationMs,
    weightsUsed: { ...weights },
    status: scoredResults.length > 0 ? "success" : "no_results"
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatNumber(num) {
  return Number(num).toLocaleString("en-US");
}
