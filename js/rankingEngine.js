/**
 * ARCHON SEARCH '98 - Multi-Signal Ranking Engine
 * 
 * ============================================================================
 * RANKING FORMULA & MATHEMATICAL DESIGN
 * ============================================================================
 * 
 * In early web search (1995-1997), engines like AltaVista and Lycos relied almost
 * entirely on keyword density. This caused severe vulnerabilities: keyword stuffing
 * and clickbait easily gamed the index.
 * 
 * By 1998, pioneering search architectures introduced multi-signal ranking:
 * combining text relevance with hyperlink topology (citation graph), document quality,
 * and user behavioral feedback.
 * 
 * ARCHON calculates an aggregate document score S_final in [0, 100] via a weighted
 * combination of normalized individual signals:
 * 
 *    S_final = (W_rel * S_rel + W_pop * S_pop + W_eng * S_eng + W_lnk * S_lnk + W_beh * S_beh + W_qlt * S_qlt) / W_total
 * 
 * Where:
 *  1. S_rel (Query Relevance): Token frequency weighted by field importance (Title: 4x,
 *     Keywords/Topics: 2.5x, Description: 1.8x, Content: 1.0x), plus exact phrase bonus
 *     and query-term coverage penalty.
 * 
 *  2. S_pop (Popularity): Logarithmic transformation of view counts.
 *     Formula: S_pop = min(100, (log10(views + 10) - log10(100)) / (log10(MAX_VIEWS) - log10(100)) * 100)
 *     Safeguard: Log scaling dampens viral outliers so high views cannot completely
 *     swamp relevance.
 * 
 *  3. S_eng (User Engagement / Dwell Time):
 *     Safeguard: Average time spent on page does NOT scale linearly to infinity.
 *     - < 20s: Rapid bounce penalty (poor match or misleading snippet).
 *     - 75s - 300s: Optimal deep-reading window (peak scores: 85 - 100 pts).
 *     - > 600s: Idle/abandoned tab safeguard! Extreme times (e.g. 1,800s) plateau and
 *       gently taper to 75 pts so an abandoned browser tab does NOT unfairly dominate
 *       focused, well-written reads.
 * 
 *  4. S_lnk (Link Signals): Hyperlink citation graph strength. Combines square-root
 *     damped inbound link counts weighted by referring domain authority, plus outbound
 *     link quality verification (penalizing link farms).
 * 
 *  5. S_beh (User Behavior): Aggregate click-through rate (CTR = clicks / impressions)
 *     and post-click satisfaction / dwell satisfaction rate.
 * 
 *  6. S_qlt (Quality & Freshness): Baseline editorial standard and document freshness.
 * 
 * ============================================================================
 * TUNING RANKING WEIGHTS
 * ============================================================================
 * You can adjust the weights in DEFAULT_WEIGHTS below or at runtime via
 * `setRankingWeights(...)` or by applying one of the PRESETS.
 */

// Default weights: Sum to 100 for intuitive percentage representation
export const DEFAULT_WEIGHTS = {
  relevance: 40,   // Query matching (title, content, keywords)
  popularity: 15,  // Log-scaled views
  engagement: 15,  // Dwell time with non-linear saturation
  links: 15,       // Inbound citation graph + outbound trust
  behavior: 10,    // Aggregate CTR and satisfaction
  quality: 5       // Content quality and freshness
};

// Preset configurations for interactive demonstrations
export const PRESETS = {
  balanced: {
    id: "balanced",
    name: "Balanced Standard (Default)",
    description: "Multi-signal synthesis balancing textual relevance, link graph authority, and reader satisfaction.",
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
    description: "Relies primarily on exact keyword frequency. Demonstrates how easily spam/clickbait can rank.",
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

/**
 * Stopwords to ignore in basic tokenization
 */
const STOPWORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to",
  "was", "what", "when", "where", "who", "will", "with"
]);

/**
 * Tokenize a text string into normalized alphanumeric terms
 * @param {string} text 
 * @returns {string[]} array of clean tokens
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
 * 1. Query Relevance Score Calculation (S_rel in [0, 100])
 * 
 * Evaluates how well the title, description, content, and explicit keywords match the search.
 * Includes field weighting and coverage penalties.
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

  let totalRawScore = 0;
  let matchedUniqueTokens = 0;
  let titleMatches = 0;

  for (const token of queryTokens) {
    let tokenMatched = false;

    // Field weights:
    // Title is the strongest indicator (4.0x)
    const titleRegex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
    const titleCount = (lowerTitle.match(titleRegex) || []).length;
    if (titleCount > 0) {
      totalRawScore += titleCount * 4.0;
      titleMatches += titleCount;
      tokenMatched = true;
    }

    // Keywords and topics are explicit human/editorial labels (2.5x)
    if (lowerKeywords.includes(token) || lowerTopics.includes(token)) {
      totalRawScore += 2.5;
      tokenMatched = true;
    }

    // Description snippet match (1.8x)
    const descRegex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
    const descCount = (lowerDesc.match(descRegex) || []).length;
    if (descCount > 0) {
      totalRawScore += Math.min(3, descCount) * 1.8;
      tokenMatched = true;
    }

    // Main content match (1.0x with diminishing returns)
    const contentRegex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
    const contentCount = (lowerContent.match(contentRegex) || []).length;
    if (contentCount > 0) {
      totalRawScore += Math.min(6, contentCount) * 1.0;
      tokenMatched = true;
    }

    if (tokenMatched) {
      matchedUniqueTokens++;
    }
  }

  // If no tokens matched at all, relevance is 0
  if (matchedUniqueTokens === 0) {
    return { score: 0, details: { matchedCount: 0, titleMatches: 0, exactPhrase: false } };
  }

  // Exact phrase match bonus: If multi-term query appears verbatim in title or description (+25%)
  let exactPhrase = false;
  if (queryTokens.length > 1 && cleanRawQuery.length > 3) {
    if (lowerTitle.includes(cleanRawQuery)) {
      totalRawScore *= 1.35;
      exactPhrase = true;
    } else if (lowerDesc.includes(cleanRawQuery)) {
      totalRawScore *= 1.20;
      exactPhrase = true;
    }
  }

  // Coverage penalty: if user queried "space telescope images" but page only has "space",
  // scale down by (matchedTokens / totalTokens)
  const coverageRatio = matchedUniqueTokens / queryTokens.length;
  totalRawScore *= coverageRatio;

  // Normalize raw score to [0, 100] using a smooth sigmoid-like asymptote:
  // score = (raw / (raw + 12)) * 100
  const normalizedScore = Math.min(100, Math.round((totalRawScore / (totalRawScore + 10)) * 100));

  return {
    score: normalizedScore,
    details: {
      matchedCount: matchedUniqueTokens,
      totalQueryTokens: queryTokens.length,
      coverageRatio: Math.round(coverageRatio * 100),
      titleMatches,
      exactPhrase,
      rawScore: parseFloat(totalRawScore.toFixed(2))
    }
  };
}

/**
 * 2. Popularity Score Calculation (S_pop in [0, 100])
 * 
 * Safely scales raw page views using a logarithmic curve:
 * S_pop = (log10(views) - log10(minViews)) / (log10(maxViews) - log10(minViews)) * 100
 * 
 * This ensures that a page with 400,000 views does not drown out a highly relevant
 * 10,000 view academic paper.
 */
export function calculatePopularity(views) {
  const safeViews = Math.max(100, Number(views) || 0);
  const minLog = Math.log10(100);     // 2.0 (100 views)
  const maxLog = Math.log10(500000);  // ~5.7 (500k views)
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
 * Non-linear engagement model with explicit safeguards against treating longer visits
 * as automatically better:
 * 
 * - t < 20s: Rapid bounce penalty (poor answer or spam snippet).
 * - 20s <= t < 75s: Moderate interest.
 * - 75s <= t <= 300s: Optimal deep reading zone (articles/papers actively read).
 * - 300s < t <= 600s: Sustained deep read (plateaus at 90-95 pts).
 * - t > 600s: Safeguard for idle / abandoned browser tabs! Extreme times (e.g. 1800s)
 *   taper off to 75 pts to avoid rewarding unattended open tabs.
 */
export function calculateEngagement(avgTimeSeconds) {
  const t = Math.max(0, Number(avgTimeSeconds) || 0);
  let score = 0;
  let category = "Rapid Bounce";

  if (t < 20) {
    // Severe bounce penalty
    score = (t / 20) * 35;
    category = "Immediate Bounce (<20s)";
  } else if (t < 75) {
    // Quick scan
    score = 35 + ((t - 20) / (75 - 20)) * 45; // 35 -> 80
    category = "Quick Scan (20-75s)";
  } else if (t <= 300) {
    // Prime sweet spot for reading an article
    score = 80 + ((t - 75) / (300 - 75)) * 20; // 80 -> 100
    category = "Deep Active Read (75-300s)";
  } else if (t <= 600) {
    // Sustained high engagement
    score = 95 - ((t - 300) / (600 - 300)) * 5; // 95 -> 90
    category = "Extended Dwell (5-10m)";
  } else {
    // Safeguard: User left the tab open and walked away (idle tab)
    // Tapers down and plateaus at 75 pts
    const decay = Math.min(20, ((t - 600) / 1200) * 20);
    score = Math.max(70, 90 - decay);
    category = "Idle / Abandoned Tab Safeguard (>10m)";
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
 * Combines inbound citation authority (inspired by citation analysis / early PageRank)
 * with outbound link trust verification.
 */
export function calculateLinkScore(inboundLinks, inboundQuality = 0.8, outboundLinks = 10, outboundTrust = 0.8) {
  const inCount = Math.max(0, Number(inboundLinks) || 0);
  const inQual = Math.max(0.1, Math.min(1.0, Number(inboundQuality) || 0.8));
  const outCount = Math.max(0, Number(outboundLinks) || 0);
  const outTrust = Math.max(0.1, Math.min(1.0, Number(outboundTrust) || 0.8));

  // Inbound citation score: square root dampened
  // sqrt(100) = 10 * 10 * quality = 100 max points
  const rawInbound = Math.min(100, Math.sqrt(inCount) * 10.0 * inQual);

  // Outbound link quality modifier:
  // - High quality outbound links to reputable resources boost trust
  // - High outbound links with very low trust indicates a link farm/spam directory
  let outboundScore = outTrust * 100;
  if (outCount > 30 && outTrust < 0.4) {
    // Severe link farm penalty
    outboundScore *= 0.3;
  }

  // Blended link score: 75% inbound authority, 25% outbound hygiene
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
 * Combines aggregate Click-Through Rate (CTR) and post-click satisfaction rate.
 * Note: Uses aggregate statistics only; does NOT track individual users.
 */
export function calculateUserBehavior(aggregateClicks, impressions, satisfactionRate = 0.8) {
  const clicks = Math.max(0, Number(aggregateClicks) || 0);
  const imps = Math.max(1, Number(impressions) || 1);
  const satRate = Math.max(0, Math.min(1.0, Number(satisfactionRate) || 0.8));

  const ctr = clicks / imps; // Typically 0.02 to 0.25

  // Map CTR to a 0-100 score: 5% is average (50 pts), 20%+ is stellar (95-100 pts)
  const ctrScore = Math.min(100, Math.round((ctr / 0.20) * 100));

  // Satisfaction rate directly scales to 0-100
  const satScore = Math.round(satRate * 100);

  // Blended behavior score: 40% CTR, 60% Satisfaction (satisfaction matters more than clicks)
  const score = Math.round(0.40 * ctrScore + 0.60 * satScore);

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
 * Generate human-readable "Why this result?" badges and explanation
 */
export function generateExplanations(signals, contributions, query) {
  const badges = [];
  const bulletReasons = [];

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
  if (signals.engagement.seconds >= 180 && signals.engagement.seconds <= 360) {
    const mins = Math.floor(signals.engagement.seconds / 60);
    const secs = signals.engagement.seconds % 60;
    badges.push({ text: `High Reading Dwell (${mins}m ${secs}s)`, type: "engagement" });
    bulletReasons.push(`Readers stay deeply engaged in the optimal comprehension window (${mins}m ${secs}s avg dwell)`);
  } else if (signals.engagement.seconds > 600) {
    bulletReasons.push(`Extended dwell time (${Math.round(signals.engagement.seconds / 60)}m); idle tab safeguard applied to prevent score inflation`);
  } else if (signals.engagement.seconds < 20) {
    bulletReasons.push(`Low dwell time (${signals.engagement.seconds}s avg) penalized for high bounce probability`);
  }

  // Popularity explanation
  if (signals.popularity.views >= 200000) {
    badges.push({ text: `Popular (${formatNumber(signals.popularity.views)} views)`, type: "popularity" });
    bulletReasons.push(`High global readership with log-scaled view dampening (${formatNumber(signals.popularity.views)} views)`);
  }

  // User behavior explanation
  if (signals.behavior.satisfactionRate >= 0.92) {
    badges.push({ text: `${signals.behavior.satisfactionPercent}% Satisfaction`, type: "behavior" });
    bulletReasons.push(`High user satisfaction score: ${signals.behavior.satisfactionPercent}% of visitors found this answer helpful`);
  } else if (signals.behavior.satisfactionRate <= 0.30) {
    bulletReasons.push(`Poor user satisfaction (${signals.behavior.satisfactionPercent}%) indicates low result fulfillment`);
  }

  // Primary driver determination: find which weighted signal contributed the most
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
    badges: badges.slice(0, 3), // Top 3 most informative badges
    bulletReasons,
    primaryDriver: primaryDriverNames[primaryDriverKey] || "Query Relevance"
  };
}

/**
 * Execute Search and Ranking over a document collection
 * 
 * @param {Array} pages - Dataset of document objects
 * @param {string} query - Raw search query string
 * @param {Object} userWeights - Configurable weights object
 * @returns {Object} Search outcome including sorted results, stats, and timing
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

  // Normalize weights
  const weights = {
    relevance: Math.max(0, Number(userWeights.relevance) || 0),
    popularity: Math.max(0, Number(userWeights.popularity) || 0),
    engagement: Math.max(0, Number(userWeights.engagement) || 0),
    links: Math.max(0, Number(userWeights.links) || 0),
    behavior: Math.max(0, Number(userWeights.behavior) || 0),
    quality: Math.max(0, Number(userWeights.quality) || 0)
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;

  const scoredResults = [];

  for (const page of pages) {
    // 1. Calculate Query Relevance
    const rel = calculateRelevance(page, queryTokens, rawQuery);

    // GATE: If document has zero relevance to query, it does NOT qualify as a result.
    // In 1998 search design, popularity and links cannot surface an irrelevant page.
    if (rel.score === 0) {
      continue;
    }

    // 2. Calculate remaining signals
    const pop = calculatePopularity(page.views);
    const eng = calculateEngagement(page.avgTimeOnPage);
    const lnk = calculateLinkScore(page.inboundLinks, page.inboundQuality, page.outboundLinks, page.outboundTrust);
    const beh = calculateUserBehavior(page.aggregateClicks, page.impressions, page.satisfactionRate);
    const qlt = calculateQualityFreshness(page.qualityScore, page.freshnessScore);

    const signals = {
      relevance: rel,
      popularity: pop,
      engagement: eng,
      links: lnk,
      behavior: beh,
      quality: qlt
    };

    // Calculate individual weighted contributions (out of 100 total potential points)
    const contributions = {
      relevance: {
        rawScore: rel.score,
        weight: weights.relevance,
        points: parseFloat(((rel.score * weights.relevance) / totalWeight).toFixed(2))
      },
      popularity: {
        rawScore: pop.score,
        weight: weights.popularity,
        points: parseFloat(((pop.score * weights.popularity) / totalWeight).toFixed(2))
      },
      engagement: {
        rawScore: eng.score,
        weight: weights.engagement,
        points: parseFloat(((eng.score * weights.engagement) / totalWeight).toFixed(2))
      },
      links: {
        rawScore: lnk.score,
        weight: weights.links,
        points: parseFloat(((lnk.score * weights.links) / totalWeight).toFixed(2))
      },
      behavior: {
        rawScore: beh.score,
        weight: weights.behavior,
        points: parseFloat(((beh.score * weights.behavior) / totalWeight).toFixed(2))
      },
      quality: {
        rawScore: qlt.score,
        weight: weights.quality,
        points: parseFloat(((qlt.score * weights.quality) / totalWeight).toFixed(2))
      }
    };

    // Final Composite Score (0.0 to 100.0)
    const compositeScore = Object.values(contributions).reduce((acc, c) => acc + c.points, 0);
    const finalScore = parseFloat(compositeScore.toFixed(1));

    // Generate explanations
    const explanations = generateExplanations(signals, contributions, rawQuery);

    scoredResults.push({
      page,
      finalScore,
      signals,
      contributions,
      explanations
    });
  }

  // Sort descending by finalScore
  // Secondary sort by relevance score, tertiary by link score for deterministic ranking
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

/**
 * Helper to escape special regex characters in search terms
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Format numbers with commas (e.g. 142000 -> "142,000")
 */
export function formatNumber(num) {
  return Number(num).toLocaleString("en-US");
}
