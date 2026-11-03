# ARCHON '98 — Multi-Signal Web Search Engine Prototype

A fast, working prototype of a search engine inspired by the bold, simple feel of the early web in 1998. Designed with a memorable name, restrained nostalgic visual style, and a transparent multi-signal ranking algorithm with real-time controls.

![ARCHON 98 Banner](https://img.shields.io/badge/ARCHON-1998_Search_Engine-003366?style=flat-square)
![Tests Passing](https://img.shields.io/badge/tests-10%20passing-brightgreen?style=flat-square)
![Accessibility](https://img.shields.io/badge/a11y-WCAG%20AA%20Compliant-success?style=flat-square)
![Privacy](https://img.shields.io/badge/privacy-100%25%20Local%20%7C%20No%20Tracking-blue?style=flat-square)

---

## Key Features

1. **Bold & Restrained 1998 Visual Design**:
   - Classic centered search box with autofocus, beveled tactile buttons (`[ Archon Search ]` & `[ I'm Feeling Curious ]`).
   - Clean, rapid transition to a results page that puts useful information first: rank badges, classic blue links, green URLs, keyword-highlighted snippets, and live performance metrics.
   - Nostalgic serif and beveled system styling without copying Google's branding.

2. **Multi-Signal Ranking Architecture (`js/rankingEngine.js`)**:
   - **Query Relevance ($S_{rel}$)**: Evaluates field-weighted token frequencies (Title: 4.0x, Keywords/Topics: 2.5x, Description: 1.8x, Content: 1.0x), exact phrase matching bonus (+25%), and multi-term coverage penalties.
   - **Popularity ($S_{pop}$)**: Logarithmic view scaling $\log_{10}(\text{views})$ preventing high-traffic viral pages from overwhelming textual relevance.
   - **Reader Engagement ($S_{eng}$)**: Dwell time modeled with **safeguards against treating longer visits as automatically better**:
     - $< 20\text{s}$: Rapid bounce penalty.
     - $75\text{s} - 300\text{s}$: Optimal reading engagement window ($85 - 100$ pts).
     - $> 600\text{s}$: **Idle/abandoned tab safeguard** that tapers and caps scores at 75 pts to avoid rewarding unattended open browser tabs over focused reads.
   - **Hyperlink Citation Graph ($S_{lnk}$)**: Square-root damped inbound citations weighted by referring domain authority (.edu, .org, standards bodies) plus outbound link trust verification.
   - **User Behavior Signals ($S_{beh}$)**: Aggregate click-through rate (CTR) and post-click satisfaction / low bounce rate.
   - **Quality & Freshness ($S_{qlt}$)**: Editorial craftsmanship and timestamp recency.

3. **"Why this result?" Transparency**:
   - Every search result displays contextual explanation badges (e.g., `★ Strong Title Match`, `↗ Heavily Cited`, `⏱ High Reading Dwell`, `👥 94% Satisfaction`).
   - An expandable **Score Breakdown Inspector** reveals the exact point contribution from each signal, primary ranking driver, and comparative strength bars.

4. **Interactive Algorithmic Demo Controls**:
   - Real-time sliders for all 6 signal weights (0% to 100%).
   - One-click demonstration presets:
     - **Balanced Standard (Default)**
     - **1998 Web Graph (Citation / PageRank Focus)**
     - **Pure Keyword Match (AltaVista 1995)**
     - **Crowd Wisdom (Popularity & CTR)**
     - **Deep Reading (High Engagement)**
     - **Quality & Freshness Focus**
   - Results dynamically reorder live as sliders move.

5. **Accessibility & Modern Standards**:
   - Fully semantic HTML5 (`<header>`, `<main>`, `<form role="search">`, `<fieldset>`, `<legend>`, `<dialog>`).
   - IME-safe Enter handling (`isComposing` and `keyCode === 229` checks).
   - High contrast keyboard focus indicators (`:focus-visible`).
   - Passes automated `axe-core` accessibility audits with 0 critical/serious violations.

---

## Project Structure

```
mini_google/
├── index.html              # Main HTML entry point with semantic landmarks
├── css/
│   └── styles.css          # 1998 retro beveled aesthetic with responsive layout
├── js/
│   ├── dataset.js          # 26 realistic web documents with multi-signal metadata
│   ├── rankingEngine.js    # Core ranking formula, scoring functions, and presets
│   ├── ui.js               # Card rendering, keyword highlighting, breakdown tables
│   └── app.js              # Application state, URL sync, and event controller
├── tests/
│   ├── rankingEngine.test.js # Unit tests for all scoring functions & presets
│   ├── e2e.test.js          # Full DOM integration tests (JSDOM)
│   └── a11y.test.js         # Automated axe-core accessibility audit
├── server.js               # Lightweight zero-dependency static HTTP server
└── package.json
```

---

## Running the Prototype

### 1. Start the Local Server
```bash
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Run Automated Test Suite
```bash
npm test
```
Runs all 10 unit, E2E, and accessibility tests via Node's native test runner (`node --test`).

---

## Suggested Demo Queries

Try these pre-configured searches to observe how different signals alter rankings:
- **`retro computing history`**: Compare how *Balanced Standard* suppresses low-dwell clickbait (`page-19`), while *Pure Keyword Match (AltaVista 1995)* elevates it.
- **`web crawler search engine`**: Switch to the *1998 Web Graph* preset to observe the heavily cited Stanford Anatomy paper leap to the #1 position.
- **`open source operating systems`**: Compare how Linux, FreeBSD, and GNU articles reorder between *Deep Reading* and *Popularity* modes.
- **`coffee brewing techniques`**: Compare specialty science guides against commercial keyword-stuffed pages.
- **`space telescope discoveries`**: Demonstrates the interplay between the Hubble Deep Field survey and next-generation infrared observatory proposals.

