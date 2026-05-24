/**
 * PriceWise India — Frontend Script (Premium Redesign)
 * ─────────────────────────────────────────────────────
 * Handles: theme, demo presets, form validation,
 *          /predict API call, prediction history,
 *          animated counters, scroll reveals, Chart.js
 */

/* ── DOM references ─────────────────────────────── */
const form             = document.getElementById("predict-form");
const errorBox         = document.getElementById("error-box");
const resultPrice      = document.getElementById("result-price");
const resultText       = document.getElementById("result-text");
const rangeCard        = document.getElementById("range-card");
const resultTier       = document.getElementById("result-tier");
const resultRange      = document.getElementById("result-range");
const categoryPill     = document.getElementById("category-pill");
const toastEl          = document.getElementById("toast");
const toastMsg         = document.getElementById("toast-msg");
const themeToggle      = document.getElementById("theme-toggle");
const historyList      = document.getElementById("history-list");
const clearHistoryBtn  = document.getElementById("clear-history");
const importanceScript = document.getElementById("feature-importance-data");

/* ── Fallback feature importance (shown without Flask) ── */
const FALLBACK_IMPORTANCE = [
  { feature: "living area",              importance: 0.31 },
  { feature: "lot area",                 importance: 0.18 },
  { feature: "number of bathrooms",      importance: 0.13 },
  { feature: "Built Year",               importance: 0.10 },
  { feature: "condition of the house",   importance: 0.09 },
  { feature: "number of bedrooms",       importance: 0.07 },
  { feature: "Distance from the airport",importance: 0.05 },
  { feature: "Postal Code",              importance: 0.04 },
  { feature: "Number of schools nearby", importance: 0.02 },
  { feature: "number of floors",         importance: 0.01 },
];

/* ── Demo presets ─────────────────────────────────── */
const DEMOS = {
  budget: {
    "number of bedrooms": 2, "number of bathrooms": 1,
    "living area": 950,       "lot area": 2200,
    "number of floors": 1,    "condition of the house": 3,
    "Built Year": 2008,        "Postal Code": 122004,
    "Number of schools nearby": 1, "Distance from the airport": 70,
  },
  mid: {
    "number of bedrooms": 3, "number of bathrooms": 2,
    "living area": 1900,      "lot area": 5200,
    "number of floors": 2,    "condition of the house": 4,
    "Built Year": 1998,        "Postal Code": 122006,
    "Number of schools nearby": 2, "Distance from the airport": 48,
  },
  luxury: {
    "number of bedrooms": 5, "number of bathrooms": 4,
    "living area": 4200,      "lot area": 16000,
    "number of floors": 2,    "condition of the house": 5,
    "Built Year": 2018,        "Postal Code": 122010,
    "Number of schools nearby": 3, "Distance from the airport": 22,
  },
};

/* ── Formatting helpers ───────────────────────────── */
function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(value);
}

function formatNum(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

/* ── Toast ────────────────────────────────────────── */
let toastTimer;
function showToast(message) {
  toastMsg.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

/* ── Error display ────────────────────────────────── */
function setErrors(errors = []) {
  if (!errors.length) { errorBox.classList.add("hidden"); errorBox.innerHTML = ""; return; }
  errorBox.classList.remove("hidden");
  errorBox.innerHTML = errors.map(e => `<div>• ${e}</div>`).join("");
}

/* ── Jinja fallback cleaner (static file preview) ─── */
function cleanFallbacks() {
  document.querySelectorAll("[data-fallback]").forEach(el => {
    if (el.textContent.includes("{{")) el.textContent = el.dataset.fallback;
  });
  document.querySelectorAll("[data-target]").forEach(el => {
    if (el.dataset.target.includes("{{")) el.dataset.target = el.dataset.fallback || "0";
  });
  // Score ring pct fallback
  document.querySelectorAll(".score-ring").forEach(ring => {
    if (ring.style.cssText.includes("{{")) {
      ring.style.setProperty("--pct", "89.4");
    }
  });
}

/* ── Theme ────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pw-theme", theme);
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
  showToast(`${next === "light" ? "Light" : "Dark"} theme enabled.`);
});

/* ── Demo quick-fill ──────────────────────────────── */
document.querySelectorAll("[data-demo]").forEach(btn => {
  btn.addEventListener("click", () => {
    const preset = DEMOS[btn.dataset.demo];
    if (!preset) return;
    Object.entries(preset).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });
    setErrors([]);
    showToast(`${btn.textContent.trim()} sample loaded.`);
  });
});

/* ── Local prediction history ─────────────────────── */
function getHistory()         { return JSON.parse(localStorage.getItem("pw-history") || "[]"); }
function saveHistory(items)   { localStorage.setItem("pw-history", JSON.stringify(items.slice(0, 5))); }

function renderHistory() {
  const items = getHistory();
  if (!items.length) {
    historyList.innerHTML = '<p class="empty-history">No predictions yet.</p>';
    return;
  }
  historyList.innerHTML = items.map(item => `
    <article class="history-item">
      <strong>${formatINR(item.price)}</strong>
      <span>${item.tier} · ${item.bedrooms} bed · ${formatNum(item.area)} sq ft</span>
    </article>
  `).join("");
}

function pushHistory(data) {
  const history = getHistory();
  history.unshift({
    price:    data.price,
    tier:     data.tier,
    bedrooms: data.inputs["number of bedrooms"],
    area:     data.inputs["living area"],
  });
  saveHistory(history);
  renderHistory();
}

clearHistoryBtn.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
  showToast("Prediction history cleared.");
});

/* ── Loading state ────────────────────────────────── */
function setLoading(on) {
  const btn = form.querySelector(".submit-btn");
  btn.disabled = on;
  btn.classList.toggle("loading", on);
  btn.querySelector(".btn-text").textContent = on ? "Predicting…" : "Predict price";
}

/* ── Form validation ──────────────────────────────── */
function validateForm() {
  const errors = [];
  form.querySelectorAll("input, select").forEach(field => {
    const label = field.closest("label").querySelector(".field-label").innerText.trim();
    const raw = field.value.trim();
    if (!raw) { errors.push(`${label} is required.`); return; }
    if (field.tagName === "SELECT") return;
    const val = Number(raw);
    if (!Number.isFinite(val)) { errors.push(`${label} must be a valid number.`); return; }
    if (field.min && val < Number(field.min)) errors.push(`${label} must be at least ${field.min}.`);
    if (field.max && val > Number(field.max)) errors.push(`${label} must be at most ${field.max}.`);
  });
  return errors;
}

/* ── Prediction API call ──────────────────────────── */
form.addEventListener("submit", async e => {
  e.preventDefault();
  setErrors([]);

  const errors = validateForm();
  if (errors.length) { setErrors(errors); showToast("Please fix the highlighted values."); return; }

  const payload = Object.fromEntries(new FormData(form).entries());
  setLoading(true);

  try {
    const res  = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      setErrors(data.errors || ["Prediction failed. Please check your inputs."]);
      showToast("Prediction failed.");
      return;
    }

    /* ── Render result ── */
    resultPrice.textContent = formatINR(data.price);
    resultText.textContent  = "Machine learning estimate generated from the submitted property profile.";
    resultTier.textContent  = `${data.tier} property`;
    resultRange.textContent = `${formatINR(data.range_low)} – ${formatINR(data.range_high)}`;
    categoryPill.textContent = data.tier;
    rangeCard.classList.remove("hidden");

    pushHistory(data);
    showToast("Valuation generated successfully.");
  } catch (err) {
    setErrors(["Could not connect to the prediction server. Make sure the Flask app is running."]);
    showToast("Server connection failed.");
  } finally {
    setLoading(false);
  }
});

/* ── Animated counters ────────────────────────────── */
function initCounters() {
  document.querySelectorAll("[data-counter]").forEach(el => {
    const target = Number(el.dataset.target || 0);
    if (!Number.isFinite(target)) return;
    const duration = 1400;
    const start    = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      el.textContent = formatNum(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ── Scroll-reveal animations ─────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

/* ── Feature importance chart ─────────────────────── */
function loadImportance() {
  if (importanceScript && !importanceScript.textContent.includes("{{")) {
    try { return JSON.parse(importanceScript.textContent); } catch (_) { /* fall through */ }
  }
  return FALLBACK_IMPORTANCE;
}

function initChart() {
  const canvas = document.getElementById("importance-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const data = loadImportance();
  if (!data.length) return;

  // Colour palette matching design tokens
  const colours = [
    "#f5c842", "#22d3ee", "#a78bfa", "#34d399",
    "#f87171", "#60a5fa", "#fbbf24", "#c084fc",
    "#fb923c", "#94a3b8",
  ];

  new Chart(canvas, {
    type: "bar",
    data: {
      labels:   data.map(d => d.feature),
      datasets: [{
        label:           "Importance",
        data:            data.map(d => d.importance),
        backgroundColor: colours.slice(0, data.length),
        borderRadius:    6,
        borderSkipped:   false,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#07111f",
          titleColor:      "#f5c842",
          bodyColor:       "#b8c6de",
          padding:         14,
          displayColors:   false,
          callbacks: {
            label: ctx => ` ${(ctx.raw * 100).toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid:  { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#7a8ba4", font: { size: 12 } },
        },
        y: {
          grid:  { display: false },
          ticks: { color: "#b8c6de", font: { size: 12, weight: "600" } },
        },
      },
    },
  });
}

/* ── Boot ─────────────────────────────────────────── */
cleanFallbacks();
applyTheme(localStorage.getItem("pw-theme") || "dark");
renderHistory();
initReveal();
initCounters();
initChart();

// Lucide icons
if (window.lucide) window.lucide.createIcons();
