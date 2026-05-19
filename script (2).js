/* ==========================================================================
   script.js — House Price Predictor India
   Handles form submission, prediction display, chart rendering, and demo fills.
   ========================================================================== */

"use strict";

// ── Feature importance chart (renders on page load) ───────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderImportanceChart();
});

/**
 * renderImportanceChart
 * Draws a horizontal bar chart of Random Forest feature importances
 * using Chart.js. Data is passed from Flask via window.DATASET_STATS.
 */
function renderImportanceChart() {
  const stats = window.DATASET_STATS || {};
  const imp   = stats.feature_importances || {};

  // Human-friendly labels matching the MATLAB variable names
  const labelMap = {
    numberOfBedrooms:       "Bedrooms",
    numberOfBathrooms:      "Bathrooms",
    livingArea:             "Living Area",
    lotArea:                "Lot Area",
    numberOfFloors:         "Floors",
    conditionOfTheHouse:    "Condition",
    BuiltYear:              "Year Built",
    PostalCode:             "Postal Code",
    NumberOfSchoolsNearby:  "Schools Nearby",
    DistanceFromTheAirport: "Dist. Airport",
  };

  // Sort by importance descending
  const entries = Object.entries(imp).sort((a, b) => b[1] - a[1]);
  const labels  = entries.map(([k]) => labelMap[k] || k);
  const values  = entries.map(([, v]) => v);

  const ctx = document.getElementById("importanceChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Importance (%)",
        data: values,
        backgroundColor: values.map((_, i) =>
          `hsla(${245 + i * 8}, 70%, 65%, 0.85)`
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",           // horizontal bars
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.06)" },
          ticks: { color: "#8888aa", font: { size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#e2e2f0", font: { size: 11 } },
        },
      },
    },
  });
}


// ── submitPrediction ──────────────────────────────────────────────────────
/**
 * Reads all form inputs, sends them to the Flask /predict endpoint as JSON,
 * then displays the result card with the estimated price.
 */
async function submitPrediction() {
  // Collect input values into a plain object
  const fields = [
    "numberOfBedrooms", "numberOfBathrooms", "livingArea", "lotArea",
    "numberOfFloors", "conditionOfTheHouse", "BuiltYear", "PostalCode",
    "NumberOfSchoolsNearby", "DistanceFromTheAirport",
  ];

  const payload = {};
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) payload[id] = el.value;
  });

  // Clear any previous errors
  hideErrors();
  clearInputErrors();

  // Show loading state on the button
  setLoading(true);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Server returned validation errors
      showErrors(data.errors || ["An unexpected error occurred."]);
      setLoading(false);
      return;
    }

    // ── Display the result ────────────────────────────────────────────────
    displayResult(data, payload);

  } catch (err) {
    showErrors(["Network error — could not connect to the server. Please try again."]);
  } finally {
    setLoading(false);
  }
}


/**
 * displayResult
 * Populates and reveals the result card with the prediction data.
 *
 * @param {Object} data    — server response (predicted_price, tier, range, etc.)
 * @param {Object} payload — the original form values (for the summary)
 */
function displayResult(data, payload) {
  // Hide placeholder, show result card
  document.getElementById("result-placeholder").classList.add("hidden");
  const card = document.getElementById("result-card");
  card.classList.remove("hidden");

  // Animate the price counting up
  animateCount("result-price", 0, data.predicted_price, 1200, (v) =>
    `₹${Math.round(v).toLocaleString("en-IN")}`
  );

  // Tier badge
  const tierEl = document.getElementById("result-tier");
  tierEl.textContent = data.tier;
  tierEl.style.background = hexToRgba(data.tier_color, 0.3);

  // Confidence range
  document.getElementById("range-low").textContent =
    `₹${data.price_low.toLocaleString("en-IN")}`;
  document.getElementById("range-high").textContent =
    `₹${data.price_high.toLocaleString("en-IN")}`;

  // Input summary grid
  const summaryEl = document.getElementById("result-summary");
  const summaryData = [
    ["Bedrooms",       payload.numberOfBedrooms],
    ["Bathrooms",      payload.numberOfBathrooms],
    ["Living Area",    `${payload.livingArea} sq ft`],
    ["Lot Area",       `${parseInt(payload.lotArea).toLocaleString()} sq ft`],
    ["Floors",         payload.numberOfFloors],
    ["Condition",      `${payload.conditionOfTheHouse}/5`],
    ["Year Built",     payload.BuiltYear],
    ["Postal Code",    payload.PostalCode],
    ["Schools Nearby", payload.NumberOfSchoolsNearby],
    ["Dist. Airport",  `${payload.DistanceFromTheAirport} km`],
  ];
  summaryEl.innerHTML = summaryData
    .map(
      ([k, v]) =>
        `<div class="summary-row">
           <span class="summary-key">${k}</span>
           <span class="summary-val">${v}</span>
         </div>`
    )
    .join("");

  // Smooth scroll to the result panel on mobile
  if (window.innerWidth < 900) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}


// ── resetForm ─────────────────────────────────────────────────────────────
/**
 * Clears all inputs and hides the result card, returning to the placeholder.
 */
function resetForm() {
  const fields = [
    "numberOfBedrooms", "numberOfBathrooms", "livingArea", "lotArea",
    "numberOfFloors", "conditionOfTheHouse", "BuiltYear", "PostalCode",
    "NumberOfSchoolsNearby", "DistanceFromTheAirport",
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  hideErrors();
  clearInputErrors();
  document.getElementById("result-card").classList.add("hidden");
  document.getElementById("result-placeholder").classList.remove("hidden");
}


// ── fillDemo ──────────────────────────────────────────────────────────────
/**
 * Pre-fills the form with demo values for three property archetypes.
 * Great for showing the app off quickly.
 *
 * @param {'budget'|'midrange'|'luxury'} type
 */
function fillDemo(type) {
  const demos = {
    budget: {
      numberOfBedrooms: 2, numberOfBathrooms: 1,
      livingArea: 900, lotArea: 4000,
      numberOfFloors: 1, conditionOfTheHouse: 2,
      BuiltYear: 1985, PostalCode: 122010,
      NumberOfSchoolsNearby: 1, DistanceFromTheAirport: 78,
    },
    midrange: {
      numberOfBedrooms: 3, numberOfBathrooms: 2.5,
      livingArea: 1930, lotArea: 7620,
      numberOfFloors: 2, conditionOfTheHouse: 3,
      BuiltYear: 1997, PostalCode: 122032,
      NumberOfSchoolsNearby: 2, DistanceFromTheAirport: 65,
    },
    luxury: {
      numberOfBedrooms: 5, numberOfBathrooms: 4,
      livingArea: 5200, lotArea: 25000,
      numberOfFloors: 2.5, conditionOfTheHouse: 5,
      BuiltYear: 2010, PostalCode: 122050,
      NumberOfSchoolsNearby: 3, DistanceFromTheAirport: 52,
    },
  };

  const values = demos[type];
  if (!values) return;

  Object.entries(values).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  hideErrors();
  clearInputErrors();

  // Auto-submit after a short delay so the user can see the fill
  setTimeout(submitPrediction, 300);
}


// ── copyResult ────────────────────────────────────────────────────────────
/**
 * Copies the prediction result text to the clipboard.
 */
function copyResult() {
  const priceEl = document.getElementById("result-price");
  const tierEl  = document.getElementById("result-tier");
  const lowEl   = document.getElementById("range-low");
  const highEl  = document.getElementById("range-high");

  const text = [
    `House Price Estimate: ${priceEl.textContent}`,
    `Tier: ${tierEl.textContent}`,
    `80% Confidence Range: ${lowEl.textContent} – ${highEl.textContent}`,
    `Generated by PriceWise India`,
  ].join("\n");

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => (btn.textContent = "📋 Copy"), 2000);
  });
}


// ── Helpers ───────────────────────────────────────────────────────────────

/** Show validation errors in the error box */
function showErrors(errors) {
  const box  = document.getElementById("error-box");
  const list = document.getElementById("error-list");
  list.innerHTML = errors.map((e) => `<li>${e}</li>`).join("");
  box.classList.remove("hidden");
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Hide the error box */
function hideErrors() {
  document.getElementById("error-box").classList.add("hidden");
}

/** Remove red border from all inputs */
function clearInputErrors() {
  document.querySelectorAll(".form-input.error").forEach((el) =>
    el.classList.remove("error")
  );
}

/** Toggle the loading spinner / disable state on the predict button */
function setLoading(isLoading) {
  const btn    = document.getElementById("predict-btn");
  const text   = document.getElementById("btn-text");
  const loader = document.getElementById("btn-loader");

  btn.disabled = isLoading;
  text.classList.toggle("hidden", isLoading);
  loader.classList.toggle("hidden", !isLoading);
}

/**
 * animateCount
 * Smoothly animates a number from `start` to `end` over `duration` ms.
 *
 * @param {string}   elId     — element id to update
 * @param {number}   start    — starting value
 * @param {number}   end      — target value
 * @param {number}   duration — ms
 * @param {Function} format   — formatting function (value) => string
 */
function animateCount(elId, start, end, duration, format) {
  const el   = document.getElementById(elId);
  if (!el) return;
  const startTime = performance.now();

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = format(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** Convert hex colour + alpha to rgba() string */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
