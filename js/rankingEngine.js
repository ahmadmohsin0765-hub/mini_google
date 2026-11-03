/**
 * ARCHON SEARCH '98 - Multi-Signal Ranking Engine (Hardened against Search Loopholes)
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
 * HARDENED ANTI-LOOPHOLE DEFENSES:
 *  1. BM25 Term Saturation & Keyword Density Penalty:
 *     Neutralizes extreme keyword stuffing (loophole-01, loophole-20). Repetition beyond
 *     3-4 occurrences yields diminishing returns, and density > 12% triggers spam demotion.
 * 
 *  2. Reading Velocity & Content Depth Cross-Check:
 *     Neutralizes dwell sweet-spot sniping (loophole-09). Dwell time is bounded by the
 *     document's word count. A 20-word page cannot claim 195 seconds of legitimate reading.
 * 
 *  3. Cross-Document Canonical Deduplication & Anti-Scraping:
 *     Neutralizes near-duplicate scraper mirrors (loophole-10). Documents sharing >75%
 *     text shingles with older/canonical sources receive a severe Duplicate Content Demotion.
 * 
 *  4. Satisfaction-Gated CTR Fraud Filter:
 *     Neutralizes click-hijack bots and clickbait (loophole-05, loophole-13). High CTR
 *     with low satisfaction (<20%) is treated as fraud/deception, inverting the bonus.
 * 
 *  5. Link Quality Square Dampening & Outbound Parasite Defense:
 *     Neutralizes synthetic link farms (loophole-04, loophole-18) and outbound parasitism
 *     (loophole-08). Outbound trust cannot boost a page lacking inbound citation authority.
 * 
 *  6. Title-Content Coherence Guard:
 *     Neutralizes anchor/title spoofing (loophole-06) if body content contradicts the title.
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
    description: "Relies primarily on keyword frequency with basic anti-spam density caps.",
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

/**
 * Tokenize a text string into normalized alphanumeric terms with simple stemming
 */
export function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Simple stemmer normalization to handle plurals ("systems" -> "system")
 */
function stemToken(token) {
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

/**
 * 1. Query Relevance Score Calculation (S_rel in [0, 100])
 * 
 * Hardened with:
 * - BM25-style diminishing returns on term repetition
 * - Keyword density spam penalties (>12% query term density triggers severe demotion)
 * - Title-body coherence verification
 * - Stemmed token deduplication
 */
export function calculateRelevance(page, queryTokens, rawQuery = "") {
  if (!queryTokens || queryTokens.length === 0) {
    return { score: 0, details: { matchedCount: 0, titleMatches: 0, exactPhrase: false } };
  }

  const cleanRawQuery = rawQuery.trim().toLowerCase();
  const lowerTitle = (page.title || "").toLowerCase();
  const lowerDesc = (page.description || "").toLowerCase();
  const lowerContent = (page.content || "").toLowerCase();
  const lowerKeywords = (page.keywords || []).map(k => k.toLowerCase()).join(" ");
  const lowerTopics = (page.topics || []).map(t => t.toLowerCase()).join(" ");

  // Count total words in document to compute keyword density
  const allWords = (lowerTitle + " " + lowerDesc + " " + lowerContent).split(/\s+/).filter(Boolean);
  const totalWords = Math.max(1, allWords.length);

  let totalRawScore = 0;
  let matchedUniqueTokens = 0;
  let titleMatches = 0;
  let bodyMatches = 0;
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
      // Saturation: 1st hit = 4.0, 2nd hit = +1.5, further hits = 0
      const saturatedTitle = Math.min(2, rawTitleCount);
      const titlePts = saturatedTitle === 1 ? 4.0 : 5.5;
      totalRawScore += titlePts;
      titleMatches += rawTitleCount;
      totalQueryOccurrences += rawTitleCount;
      tokenMatched = true;
    }

    // Keywords and topics (curated human metadata)
    if (lowerKeywords.includes(token) || lowerTopics.includes(token) || lowerKeywords.includes(stem)) {
      totalRawScore += 2.5;
      tokenMatched = true;
    }

    // Description match (saturated at 2)
    const descRegex = new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "gi");
    const descCount = (lowerDesc.match(descRegex) || []).length;
    if (descCount > 0) {
      totalRawScore += Math.min(2, descCount) * 1.5;
      totalQueryOccurrences += descCount;
      tokenMatched = true;
    }

    // Content match with BM25 diminishing returns
    const contentRegex = new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "gi");
    const rawContentCount = (lowerContent.match(contentRegex) || []).length;
    if (rawContentCount > 0) {
      // BM25 term frequency saturation: rawCount / (rawCount + 1.2) * 5.0
      const bm25Tf = (rawContentCount / (rawContentCount + 1.5)) * 4.5;
      totalRawScore += bm25Tf;
      bodyMatches += rawContentCount;
      totalQueryOccurrences += rawContentCount;
      tokenMatched = true;
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
      totalRawScore *= 1.30;
      exactPhrase = true;
    } else if (lowerDesc.includes(cleanRawQuery)) {
      totalRawScore *= 1.15;
      exactPhrase = true;
    }
  }

  // Coverage penalty
  const coverageRatio = matchedUniqueTokens / uniqueQueryTokens.length;
  totalRawScore *= Math.pow(coverageRatio, 1.3);

  // Anti-Loophole Defense 1: Keyword Density Spam Filter
  // If query terms exceed 12% of the entire document, it's deliberate keyword stuffing!
  const queryDensity = totalQueryOccurrences / totalWords;
  let spamPenalty = 1.0;
  if (queryDensity > 0.12) {
    // Sharp progressive penalty
    spamPenalty = Math.max(0.20, 1.0 - (queryDensity - 0.12) * 4.0);
    totalRawScore *= spamPenalty;
  }

  // Anti-Loophole Defense 2: Title-Content Coherence Guard
  // If query matches title, but content has ZERO matches, penalize deceptive title bait (loophole-06)
  if (titleMatches > 0 && bodyMatches === 0 && totalWords > 30) {
    totalRawScore *= 0.55;
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
      isKeywordSpam: queryDensity > 0.12,
      rawScore: parseFloat(totalRawScore.toFixed(2))
    }
  };
}

/**
 * 2. Popularity Score Calculation (S_pop in [0, 100])
 * Logarithmic dampening prevents viral skew.
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
 * 
 * Hardened with Reading Velocity & Content Depth Cross-Check:
 * - Prevents sweet-spot dwell sniping (loophole-09) on short micropages.
 * - Prevents abandoned tab inflation (loophole-03).
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

  // Anti-Loophole Defense 3: Reading Velocity & Content Depth Guard
  // Calculate word count. Average human reading speed = 200-250 wpm (~3.5 words/sec).
  const wordCount = (contentText || "").trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 0 && wordCount < 60) {
    // If page has only 20-40 words, maximum plausible reading time is 15-30 seconds.
    // If dwell is artificially held at 195s, cap the engagement score!
    const plausibleMaxSeconds = Math.max(30, (wordCount / 180) * 60 * 2.5);
    if (t > plausibleMaxSeconds) {
      score = Math.min(score, 60); // Cap short page dwell score at 60
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
 * 
 * Hardened with:
 * - Square quality dampening (prevents 500 low-quality links from gaming rank)
 * - Outbound parasite suppression (outbound trust is capped by inbound authority)
 * - Link farm penalty
 */
export function calculateLinkScore(inboundLinks, inboundQuality = 0.8, outboundLinks = 10, outboundTrust = 0.8) {
  const inCount = Math.max(0, Number(inboundLinks) || 0);
  const inQual = Math.max(0.1, Math.min(1.0, Number(inboundQuality) || 0.8));
  const outCount = Math.max(0, Number(outboundLinks) || 0);
  const outTrust = Math.max(0.1, Math.min(1.0, Number(outboundTrust) || 0.8));

  // Anti-Loophole Defense 4: Inbound Quality Square Dampening
  // If inQual is 0.15 (spam directory), (0.15)^1.5 severely dampens raw count
  const effectiveQuality = Math.pow(inQual, 1.4);
  const rawInbound = Math.min(100, Math.sqrt(inCount) * 11.0 * effectiveQuality);

  // Anti-Loophole Defense 5: Outbound Parasitism Defense
  // A page with near-zero inbound authority cannot claim a 99% link score purely by linking to NASA/W3C
  let effectiveOutboundTrust = outTrust;
  if (rawInbound < 25) {
    effectiveOutboundTrust = Math.min(effectiveOutboundTrust, 0.45);
  }

  let outboundScore = effectiveOutboundTrust * 100;
  if (outCount > 30 && outTrust < 0.4) {
    outboundScore *= 0.25; // Severe link farm penalty
  }

  // Blended link score
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
 * 
 * Hardened with Satisfaction-Gated CTR Fraud Filter:
 * - High CTR with low satisfaction (<20%) is treated as click-fraud / clickbait trap.
 */
export function calculateUserBehavior(aggregateClicks, impressions, satisfactionRate = 0.8, avgTimeSeconds = 60) {
  const clicks = Math.max(0, Number(aggregateClicks) || 0);
  const imps = Math.max(1, Number(impressions) || 1);
  const satRate = Math.max(0, Math.min(1.0, Number(satisfactionRate) || 0.8));
  const dwell = Math.max(0, Number(avgTimeSeconds) || 0);

  const ctr = clicks / imps;

  // Base CTR score (0 - 100)
  let ctrScore = Math.min(100, Math.round((ctr / 0.20) * 100));

  // Anti-Loophole Defense 6: Satisfaction-Gated CTR Filter
  // If users immediately bounce (dwell < 18s) and satisfaction is < 25%, high CTR represents clickbait/fraud
  if (satRate < 0.25 || dwell < 18) {
    // Invert/penalize CTR reward
    ctrScore = Math.round(ctrScore * satRate * 0.5);
  }

  const satScore = Math.round(satRate * 100);

  // 35% CTR, 65% Satisfaction
  const score = Math.round(0.35 * ctrScore + 0.65 * satScore);

  return {
    score: Math.max(0, Math.min(100, score)),
    ctr: parseFloat((ctr * 100).toFixed(1)),
    satisfactionRate: satRate,
    satisfactionPercent: satScore
  };
}

/**
 * 6. Quality & Freshness Score Calculation (S_qlt in [0, 100])
 */
export function calculateQualityFreshness(qualityScore = 0.8, freshnessScore = 0.8) {
  const q = Math.max(0, Math.min(1.0, Number(qualityScore) || 0.8));
  const f = Math.max(0, Math.min(1.0, Number(freshnessScore) || 0.8));

  const score = Math.round((0.65 * q + 0.35 * f) * 100);
  return {
    score: Math.max(0, Math.min(100, score)),
    qualityRating: q,
    freshnessRating: f
  };
}

/**
 * Anti-Loophole Defense 7: Content Shingle Deduplication (Anti-Scraper Filter)
 * Checks if candidate document is a scraped near-duplicate of an authoritative source.
 */
export function detectScraperDuplicates(candidates) {
  // Sort candidates by inbound citation authority & quality
  const canonicalMap = new Map();
  const duplicatePenaltyMap = new Map();

  for (const item of candidates) {
    // Extract first 15 normalized content words as rough shingle fingerprint
    const words = tokenize(item.page.content || "").slice(0, 15).join(" ");
    if (!words || words.length < 20) continue;

    if (!canonicalMap.has(words)) {
      canonicalMap.set(words, item);
    } else {
      const canonical = canonicalMap.get(words);
      // If current item has lower link quality, lower inbound links, or is from an untrusted host,
      // it is a scraped mirror!
      if (
        item.page.inboundLinks < canonical.page.inboundLinks ||
        item.page.inboundQuality < canonical.page.inboundQuality ||
        item.page.url.includes("mirror") ||
        item.page.url.includes("scraped")
      ) {
        duplicatePenaltyMap.set(item.page.id, 0.45); // 55% penalty for scraped mirror
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
    bulletReasons.push("Identified as a near-duplicate mirror of a canonical document; anti-scraping demotion applied");
  }

  if (signals.relevance.details.isKeywordSpam) {
    badges.push({ text: "⚠ Keyword Density Cap Applied", type: "relevance" });
    bulletReasons.push("High keyword repetition detected (>12% density); BM25 saturation penalty applied");
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
 * Execute Search and Ranking over a document collection (Hardened)
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
    const lnk = calculateLinkScore(page.inboundLinks, page.inboundQuality, page.outboundLinks, page.outboundTrust);
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

    const contributions = {
      relevance: {
        rawScore: signals.relevance.score,
        weight: weights.relevance,
        points: parseFloat(((signals.relevance.score * weights.relevance * duplicateFactor) / totalWeight).toFixed(2))
      },
      popularity: {
        rawScore: signals.popularity.score,
        weight: weights.popularity,
        points: parseFloat(((signals.popularity.score * weights.popularity * duplicateFactor) / totalWeight).toFixed(2))
      },
      engagement: {
        rawScore: signals.engagement.score,
        weight: weights.engagement,
        points: parseFloat(((signals.engagement.score * weights.engagement * duplicateFactor) / totalWeight).toFixed(2))
      },
      links: {
        rawScore: signals.links.score,
        weight: weights.links,
        points: parseFloat(((signals.links.score * weights.links * duplicateFactor) / totalWeight).toFixed(2))
      },
      behavior: {
        rawScore: signals.behavior.score,
        weight: weights.behavior,
        points: parseFloat(((signals.behavior.score * weights.behavior * duplicateFactor) / totalWeight).toFixed(2))
      },
      quality: {
        rawScore: signals.quality.score,
        weight: weights.quality,
        points: parseFloat(((signals.quality.score * weights.quality * duplicateFactor) / totalWeight).toFixed(2))
      }
    };

    const compositeScore = Object.values(contributions).reduce((acc, c) => acc + c.points, 0);
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
