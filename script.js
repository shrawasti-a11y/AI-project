const form = document.querySelector("#predict-form");
const errorBox = document.querySelector("#error-box");
const resultPrice = document.querySelector("#result-price");
const resultText = document.querySelector("#result-text");
const rangeCard = document.querySelector("#range-card");
const resultTier = document.querySelector("#result-tier");
const resultRange = document.querySelector("#result-range");
const categoryPill = document.querySelector("#category-pill");
const resultCard = document.querySelector(".result-card");
const toast = document.querySelector("#toast");
const themeToggle = document.querySelector("#theme-toggle");
const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history");
const importanceData = document.querySelector("#feature-importance-data");
const confidenceScore = document.querySelector("#confidence-score");
const marketTrend = document.querySelector("#market-trend");
const investmentRating = document.querySelector("#investment-rating");
const marketInsight = document.querySelector("#market-insight");
const recommendedAction = document.querySelector("#recommended-action");
const skeleton = document.querySelector("#result-skeleton");
const cursorGlow = document.querySelector("#cursor-glow");
const chatbotPanel = document.querySelector("#chatbot-panel");
const chatbotToggle = document.querySelector("#chatbot-toggle");
const chatbotClose = document.querySelector("#chatbot-close");
const backToTop = document.querySelector("#back-to-top");

let latestPrediction = null;

const demos = {
  budget: {
    "number of bedrooms": 2,
    "number of bathrooms": 1,
    "living area": 950,
    "lot area": 2200,
    "number of floors": 1,
    "condition of the house": 3,
    "Built Year": 2008,
    "Postal Code": 122004,
    "Number of schools nearby": 1,
    "Distance from the airport": 70,
  },
  mid: {
    "number of bedrooms": 3,
    "number of bathrooms": 2,
    "living area": 1900,
    "lot area": 5200,
    "number of floors": 2,
    "condition of the house": 4,
    "Built Year": 1998,
    "Postal Code": 122006,
    "Number of schools nearby": 2,
    "Distance from the airport": 48,
  },
  luxury: {
    "number of bedrooms": 5,
    "number of bathrooms": 4,
    "living area": 4200,
    "lot area": 16000,
    "number of floors": 2,
    "condition of the house": 5,
    "Built Year": 2018,
    "Postal Code": 122010,
    "Number of schools nearby": 3,
    "Distance from the airport": 22,
  },
};

function formatRupees(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function animatePrice(element, value) {
  const duration = 950;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatRupees(Math.round(value * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function setErrors(errors) {
  if (!errors.length) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
    return;
  }
  errorBox.classList.remove("hidden");
  errorBox.innerHTML = errors.map((error) => `<div>${error}</div>`).join("");
}

function getHistory() {
  return JSON.parse(localStorage.getItem("pricewise-history") || "[]");
}

function saveHistory(items) {
  localStorage.setItem("pricewise-history", JSON.stringify(items.slice(0, 6)));
}

function renderHistory() {
  const items = getHistory();
  if (!items.length) {
    historyList.innerHTML = '<p class="empty-history">No predictions yet.</p>';
    return;
  }

  historyList.innerHTML = items
    .map(
      (item) => `
        <article class="history-item">
          <strong>${item.formatted_price}</strong>
          <span>${item.property_category} - ${item.confidence_score}% confidence - ${item.prediction_id}</span>
        </article>
      `
    )
    .join("");
}

function addHistory(data) {
  const history = getHistory();
  history.unshift(data);
  saveHistory(history);
  renderHistory();
}

function setLoading(isLoading) {
  const submitButton = form.querySelector(".submit-btn");
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  submitButton.querySelector(".btn-text").textContent = isLoading
    ? "Analyzing Property..."
    : "Predict Price";
  skeleton.classList.toggle("hidden", !isLoading);
}

function setButtonState(state) {
  const submitButton = form.querySelector(".submit-btn");
  submitButton.classList.remove("success", "error");

  if (state === "success") {
    submitButton.classList.add("success");
    submitButton.querySelector(".btn-text").textContent = "Prediction Complete";
  }

  if (state === "error") {
    submitButton.classList.add("error");
    submitButton.querySelector(".btn-text").textContent = "Try Again";
  }

  window.setTimeout(() => {
    submitButton.classList.remove("success", "error");
    submitButton.querySelector(".btn-text").textContent = "Predict Price";
  }, 1300);
}

function markInvalidFields(hasErrors) {
  form.querySelectorAll("input, select").forEach((field) => {
    field.classList.toggle("invalid", hasErrors && !field.checkValidity());
  });
}

function validateClientSide() {
  const errors = [];
  form.querySelectorAll("input, select").forEach((field) => {
    const label = field.closest("label").querySelector("span").innerText.trim();
    const value = Number(field.value);
    const min = Number(field.min);
    const max = Number(field.max);

    if (!field.value) errors.push(`${label} is required.`);
    else if (!Number.isFinite(value)) errors.push(`${label} must be a number.`);
    else if (field.min && value < min) errors.push(`${label} must be at least ${min}.`);
    else if (field.max && value > max) errors.push(`${label} must be at most ${max}.`);
  });
  return errors;
}

function renderPrediction(data) {
  latestPrediction = data;
  animatePrice(resultPrice, data.predicted_price);
  resultText.textContent = `Prediction ID ${data.prediction_id} generated in ${data.performance.response_time_ms} ms.`;
  resultTier.textContent = `${data.property_category} property`;
  resultRange.textContent = `${data.price_range.formatted_low} - ${data.price_range.formatted_high}`;
  categoryPill.textContent = data.property_category;
  confidenceScore.textContent = `${data.confidence_score}%`;
  marketTrend.textContent = data.market_trend;
  investmentRating.textContent = data.investment_rating;
  marketInsight.textContent = data.market_insight;
  recommendedAction.textContent = data.recommended_action;
  rangeCard.classList.remove("hidden");
  resultCard.classList.remove("has-result");
  void resultCard.offsetWidth;
  resultCard.classList.add("has-result");
}

function loadFeatureImportance() {
  if (!importanceData) return [];
  try {
    return JSON.parse(importanceData.textContent);
  } catch (error) {
    return [];
  }
}

function initChart() {
  const chartCanvas = document.querySelector("#importance-chart");
  const featureImportance = loadFeatureImportance();
  if (!chartCanvas || !featureImportance.length || typeof Chart === "undefined") return;

  new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: featureImportance.map((item) => item.feature),
      datasets: [
        {
          data: featureImportance.map((item) => item.importance),
          backgroundColor: ["#00f5d4", "#38bdf8", "#a855f7", "#f5c842", "#f472b6", "#4ade80", "#7c3aed", "#0ea5e9", "#f97316", "#94a3b8"],
          borderRadius: 9,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#030712",
          titleColor: "#ffffff",
          bodyColor: "#dbeafe",
          padding: 12,
          displayColors: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(148, 163, 184, 0.16)" },
          ticks: { color: "#7f8eaa" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#c8d4e7", font: { weight: 700 } },
        },
      },
    },
  });
}

function initCounters() {
  document.querySelectorAll("[data-counter]").forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const duration = 1200;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      counter.textContent = formatNumber(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

document.querySelectorAll("[data-demo]").forEach((button) => {
  button.addEventListener("click", () => {
    const values = demos[button.dataset.demo];
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });
    setErrors([]);
    markInvalidFields(false);
    showToast(`${button.textContent.trim()} sample loaded.`);
  });
});

form.querySelectorAll("input, select").forEach((field) => {
  field.addEventListener("input", () => {
    field.classList.toggle("invalid", field.value !== "" && !field.checkValidity());
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setErrors([]);

  const validationErrors = validateClientSide();
  if (validationErrors.length) {
    setErrors(validationErrors);
    markInvalidFields(true);
    setButtonState("error");
    showToast("Please fix the highlighted values.");
    return;
  }

  markInvalidFields(false);
  setLoading(true);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setErrors(data.errors || ["Prediction failed. Please check your inputs."]);
      setButtonState("error");
      showToast("Prediction failed.");
      return;
    }

    renderPrediction(data);
    addHistory(data);
    setButtonState("success");
    showToast("Prediction complete.");
  } catch (error) {
    setErrors(["Could not connect to the prediction server. Run Flask and try again."]);
    setButtonState("error");
    showToast("Server connection failed.");
  } finally {
    setLoading(false);
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("pricewise-theme", nextTheme);
  showToast(`${nextTheme === "light" ? "Light" : "Dark"} mode enabled.`);
});

clearHistoryButton.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
  showToast("Prediction history cleared.");
});

document.querySelector("#export-report").addEventListener("click", () => {
  if (!latestPrediction) return showToast("Generate a prediction first.");
  const blob = new Blob([JSON.stringify(latestPrediction, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${latestPrediction.prediction_id}-pricewise-report.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#share-result").addEventListener("click", async () => {
  if (!latestPrediction) return showToast("Generate a prediction first.");
  const text = `PriceWise India estimate: ${latestPrediction.formatted_price} (${latestPrediction.property_category})`;
  await navigator.clipboard.writeText(text);
  showToast("Result copied for sharing.");
});

document.querySelector("#save-result").addEventListener("click", () => {
  if (!latestPrediction) return showToast("Generate a prediction first.");
  addHistory(latestPrediction);
  showToast("Prediction saved locally.");
});

chatbotToggle.addEventListener("click", () => chatbotPanel.classList.toggle("hidden"));
chatbotClose.addEventListener("click", () => chatbotPanel.classList.add("hidden"));
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("show", window.scrollY > 500);
});

window.addEventListener("mousemove", (event) => {
  cursorGlow.style.transform = `translate(${event.clientX - 140}px, ${event.clientY - 140}px)`;
});

document.documentElement.dataset.theme = localStorage.getItem("pricewise-theme") || "dark";
renderHistory();
initCounters();
initChart();

if (window.AOS) AOS.init({ duration: 700, once: true, offset: 80 });
if (window.lucide) window.lucide.createIcons();
if (window.gsap) {
  gsap.from(".hero-copy", { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" });
}
