/**
 * ARCHON SEARCH '98 - Main Application Controller
 */

import { SAMPLE_PAGES } from "./dataset.js";
import {
  executeSearch,
  DEFAULT_WEIGHTS,
  PRESETS,
  formatNumber
} from "./rankingEngine.js";
import {
  renderResultCard,
  bindBreakdownToggles
} from "./ui.js";

// Application State
const state = {
  currentQuery: "",
  weights: { ...DEFAULT_WEIGHTS },
  currentPresetId: "balanced",
  lastSearchResults: null,
  isTunerOpen: true
};

// Curated sample queries for "I'm Feeling Curious"
const SAMPLE_QUERIES = [
  "open source operating systems",
  "retro computing history",
  "space telescope discoveries",
  "coffee brewing techniques",
  "digital privacy cryptography",
  "web crawler search engine",
  "unix and c language",
  "hubble deep field galaxies",
  "mechanical keyboards"
];

// DOM Elements
const homeView = document.getElementById("home-view");
const resultsView = document.getElementById("results-view");
const homeSearchForm = document.getElementById("home-search-form");
const resultsSearchForm = document.getElementById("results-search-form");
const homeSearchInput = document.getElementById("home-search-input");
const resultsSearchInput = document.getElementById("results-search-input");
const homeCuriousBtn = document.getElementById("home-curious-btn");
const resultsCuriousBtn = document.getElementById("results-curious-btn");
const resultsList = document.getElementById("results-list");
const resultsStatsOutput = document.getElementById("results-stats-output");
const noResultsState = document.getElementById("no-results-state");
const emptyQueryState = document.getElementById("empty-query-state");
const noResultsQueryMsg = document.getElementById("no-results-query-msg");
const emptyStateReturnBtn = document.getElementById("empty-state-return-btn");
const brandLink = document.getElementById("brand-link");

// Tuner Elements
const tunerPanel = document.getElementById("tuner-panel");
const toggleTunerBtn = document.getElementById("toggle-tuner-btn");
const closeTunerBtn = document.getElementById("close-tuner-btn");
const presetSelect = document.getElementById("ranking-preset-select");
const presetDescText = document.getElementById("preset-description-text");
const resetWeightsBtn = document.getElementById("reset-weights-btn");
const resultsGridContainer = document.getElementById("results-grid-container");

// Slider Elements
const sliders = {
  relevance: document.getElementById("weight-relevance"),
  popularity: document.getElementById("weight-popularity"),
  engagement: document.getElementById("weight-engagement"),
  links: document.getElementById("weight-links"),
  behavior: document.getElementById("weight-behavior"),
  quality: document.getElementById("weight-quality")
};

const sliderValPills = {
  relevance: document.getElementById("val-relevance"),
  popularity: document.getElementById("val-popularity"),
  engagement: document.getElementById("val-engagement"),
  links: document.getElementById("val-links"),
  behavior: document.getElementById("val-behavior"),
  quality: document.getElementById("val-quality")
};

// Dialog Elements
const howRankingDialog = document.getElementById("how-ranking-dialog");
const navHowBtn = document.getElementById("nav-how-ranking-works-btn");
const resultsHowBtn = document.getElementById("results-how-btn");
const footerHowBtn = document.getElementById("footer-how-btn");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const dialogGotItBtn = document.getElementById("dialog-got-it-btn");
const navTuneBtn = document.getElementById("nav-tune-signals-btn");

/**
 * Initialize Application
 */
function init() {
  bindBreakdownToggles(resultsList);
  setupFormHandlers();
  setupTunerControls();
  setupDialogHandlers();
  setupSampleQueryButtons();

  // Check for URL query parameter (?q=...)
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  if (initialQuery && initialQuery.trim()) {
    runSearch(initialQuery.trim());
  } else {
    showHomeView();
  }
}

/**
 * Set up search forms with IME-safe Enter handling
 * (Modern Web Guidance: check isComposing and keyCode === 229)
 */
function setupFormHandlers() {
  function handleInputKeydown(e, form) {
    if (e.key === "Enter") {
      // Prevent premature submission during IME character composition
      if (e.isComposing || e.keyCode === 229) {
        return;
      }
      e.preventDefault();
      form.requestSubmit();
    }
  }

  homeSearchInput.addEventListener("keydown", (e) => handleInputKeydown(e, homeSearchForm));
  resultsSearchInput.addEventListener("keydown", (e) => handleInputKeydown(e, resultsSearchForm));

  homeSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = homeSearchInput.value.trim();
    runSearch(q);
  });

  resultsSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = resultsSearchInput.value.trim();
    runSearch(q);
  });

  // "I'm Feeling Curious" random query
  function runCurious() {
    const randomQuery = SAMPLE_QUERIES[Math.floor(Math.random() * SAMPLE_QUERIES.length)];
    homeSearchInput.value = randomQuery;
    resultsSearchInput.value = randomQuery;
    runSearch(randomQuery);
  }

  homeCuriousBtn.addEventListener("click", runCurious);
  resultsCuriousBtn.addEventListener("click", runCurious);

  // Brand link navigates back to Home
  brandLink.addEventListener("click", (e) => {
    e.preventDefault();
    showHomeView();
    window.history.pushState(null, "", window.location.pathname);
  });

  emptyStateReturnBtn.addEventListener("click", () => {
    showHomeView();
  });
}

/**
 * Setup Tuner Sliders, Presets, and Reset logic
 */
function setupTunerControls() {
  // Preset selector
  presetSelect.addEventListener("change", (e) => {
    const selectedPresetId = e.target.value;
    if (PRESETS[selectedPresetId]) {
      applyPreset(selectedPresetId);
    }
  });

  // Sliders input events
  for (const [key, sliderEl] of Object.entries(sliders)) {
    sliderEl.addEventListener("input", () => {
      const val = parseInt(sliderEl.value, 10);
      state.weights[key] = val;
      sliderValPills[key].textContent = `${val}%`;

      // Moving any slider manually switches preset to Custom
      if (presetSelect.value !== "custom") {
        let customOpt = presetSelect.querySelector('option[value="custom"]');
        if (!customOpt) {
          customOpt = document.createElement("option");
          customOpt.value = "custom";
          customOpt.textContent = "Custom Weights";
          presetSelect.appendChild(customOpt);
        }
        presetSelect.value = "custom";
        presetDescText.textContent = "Custom user-configured signal weighting.";
      }

      // Live re-ranking if we have active search
      if (state.currentQuery) {
        refreshCurrentSearch();
      }
    });
  }

  // Reset button
  resetWeightsBtn.addEventListener("click", () => {
    applyPreset("balanced");
  });

  // Toggle Tuner Panel visibility
  toggleTunerBtn.addEventListener("click", () => {
    toggleTunerPanel();
  });

  closeTunerBtn.addEventListener("click", () => {
    closeTunerPanel();
  });

  navTuneBtn.addEventListener("click", () => {
    if (resultsView.classList.contains("hidden")) {
      // If on home, run default search to open results with tuner
      runSearch("open source operating systems");
    }
    openTunerPanel();
    tunerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function openTunerPanel() {
  tunerPanel.classList.remove("hidden");
  resultsGridContainer.classList.add("has-panel");
  toggleTunerBtn.setAttribute("aria-expanded", "true");
  state.isTunerOpen = true;
}

function closeTunerPanel() {
  tunerPanel.classList.add("hidden");
  resultsGridContainer.classList.remove("has-panel");
  toggleTunerBtn.setAttribute("aria-expanded", "false");
  state.isTunerOpen = false;
}

function toggleTunerPanel() {
  if (state.isTunerOpen) {
    closeTunerPanel();
  } else {
    openTunerPanel();
  }
}

/**
 * Apply Preset weights
 */
function applyPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return;

  state.currentPresetId = presetId;
  state.weights = { ...preset.weights };
  presetSelect.value = presetId;
  presetDescText.textContent = preset.description;

  // Update slider positions and readouts
  for (const [key, val] of Object.entries(state.weights)) {
    if (sliders[key]) {
      sliders[key].value = val;
    }
    if (sliderValPills[key]) {
      sliderValPills[key].textContent = `${val}%`;
    }
  }

  // If there's an active search, re-rank immediately
  if (state.currentQuery) {
    refreshCurrentSearch();
  }
}

/**
 * Sample query buttons anywhere in document
 */
function setupSampleQueryButtons() {
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".sample-query-pill, #footer-sample-btn");
    if (!pill) return;
    const q = pill.getAttribute("data-query");
    if (q) {
      homeSearchInput.value = q;
      resultsSearchInput.value = q;
      runSearch(q);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

/**
 * Setup "How Ranking Works" Modal Dialog
 */
function setupDialogHandlers() {
  function openModal() {
    if (typeof howRankingDialog.showModal === "function") {
      howRankingDialog.showModal();
    } else {
      howRankingDialog.setAttribute("open", "");
    }
  }

  function closeModal() {
    if (typeof howRankingDialog.close === "function") {
      howRankingDialog.close();
    } else {
      howRankingDialog.removeAttribute("open");
    }
  }

  navHowBtn.addEventListener("click", openModal);
  resultsHowBtn.addEventListener("click", openModal);
  footerHowBtn.addEventListener("click", openModal);
  closeDialogBtn.addEventListener("click", closeModal);
  dialogGotItBtn.addEventListener("click", closeModal);

  // Close dialog when clicking backdrop
  howRankingDialog.addEventListener("click", (e) => {
    const rect = howRankingDialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      closeModal();
    }
  });
}

/**
 * Transition to Home View
 */
function showHomeView() {
  state.currentQuery = "";
  homeView.classList.remove("hidden");
  resultsView.classList.add("hidden");
  homeSearchInput.value = "";
  resultsSearchInput.value = "";
  homeSearchInput.focus();
}

/**
 * Transition to Results View and run search
 */
function runSearch(query) {
  const cleanQuery = (query || "").trim();
  state.currentQuery = cleanQuery;
  homeSearchInput.value = cleanQuery;
  resultsSearchInput.value = cleanQuery;

  homeView.classList.add("hidden");
  resultsView.classList.remove("hidden");

  // Update browser URL query param without reload
  if (cleanQuery) {
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(cleanQuery)}`;
    window.history.pushState({ query: cleanQuery }, "", newUrl);
  }

  refreshCurrentSearch();
}

/**
 * Re-execute search with current weights and re-render
 */
function refreshCurrentSearch() {
  const query = state.currentQuery;

  if (!query) {
    resultsList.innerHTML = "";
    noResultsState.classList.add("hidden");
    emptyQueryState.classList.remove("hidden");
    resultsStatsOutput.textContent = "Please enter a search term.";
    return;
  }

  emptyQueryState.classList.add("hidden");

  // Execute Search in Ranking Engine
  const outcome = executeSearch(SAMPLE_PAGES, query, state.weights);
  state.lastSearchResults = outcome;

  if (outcome.status === "no_results" || outcome.results.length === 0) {
    resultsList.innerHTML = "";
    noResultsQueryMsg.textContent = `Your query "${query}" did not match any documents in our 1998 index.`;
    noResultsState.classList.remove("hidden");
    resultsStatsOutput.innerHTML = `Found <strong>0</strong> results for "<strong>${escapeHtml(query)}</strong>" in ${outcome.searchTimeMs} seconds`;
    return;
  }

  noResultsState.classList.add("hidden");

  // Stats string
  const presetName = PRESETS[state.currentPresetId] ? PRESETS[state.currentPresetId].name : "Custom Weights";
  const plural = outcome.totalMatches === 1 ? "document" : "documents";
  resultsStatsOutput.innerHTML = `Found <strong>${outcome.totalMatches}</strong> matching ${plural} in <strong>${outcome.searchTimeMs} ms</strong> (Mode: ${escapeHtml(presetName)})`;

  // Render cards
  const cardsHtml = outcome.results
    .map((res, idx) => renderResultCard(res, idx, outcome.tokens, query))
    .join("");

  resultsList.innerHTML = cardsHtml;
}

// Global popstate for browser back/forward buttons
window.addEventListener("popstate", (e) => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q && q.trim()) {
    runSearch(q.trim());
  } else {
    showHomeView();
  }
});

// Run Init
init();

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

