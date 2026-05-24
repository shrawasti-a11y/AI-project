const form = document.querySelector("#predict-form");
const errorBox = document.querySelector("#error-box");
const resultPrice = document.querySelector("#result-price");
const resultText = document.querySelector("#result-text");
const rangeCard = document.querySelector("#range-card");
const resultTier = document.querySelector("#result-tier");
const resultRange = document.querySelector("#result-range");
const categoryPill = document.querySelector("#category-pill");
const toast = document.querySelector("#toast");
const themeToggle = document.querySelector("#theme-toggle");
const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history");
const importanceData = document.querySelector("#feature-importance-data");

// Used when the template is previewed without Flask rendering.
const fallbackImportance = [
  { feature: "living area", importance: 0.31 },
  { feature: "lot area", importance: 0.18 },
  { feature: "number of bathrooms", importance: 0.13 },
  { feature: "Built Year", importance: 0.1 },
  { feature: "condition of the house", importance: 0.09 },
  { feature: "number of bedrooms", importance: 0.07 },
  { feature: "Distance from the airport", importance: 0.05 },
  { feature: "Postal Code", importance: 0.04 },
  { feature: "Number of schools nearby", importance: 0.02 },
  { feature: "number of floors", importance: 0.01 },
];

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
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
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

// Replaces raw Jinja placeholders when index.html is opened directly as a file.
function cleanTemplateFallbacks() {
  document.querySelectorAll("[data-fallback]").forEach((item) => {
    if (item.textContent.includes("{{")) {
      item.textContent = item.dataset.fallback;
    }
  });

  document.querySelectorAll("[data-target]").forEach((item) => {
    if (item.dataset.target.includes("{{")) {
      item.dataset.target = item.dataset.fallback || "0";
    }
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pricewise-theme", theme);
}

function getHistory() {
  return JSON.parse(localStorage.getItem("pricewise-history") || "[]");
}

function saveHistory(items) {
  localStorage.setItem("pricewise-history", JSON.stringify(items.slice(0, 5)));
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
          <strong>${formatRupees(item.price)}</strong>
          <span>${item.tier} • ${item.bedrooms} bedrooms • ${item.area} sq ft</span>
        </article>
      `
    )
    .join("");
}

function addHistory(data) {
  const history = getHistory();
  history.unshift({
    price: data.price,
    tier: data.tier,
    bedrooms: data.inputs["number of bedrooms"],
    area: data.inputs["living area"],
  });
  saveHistory(history);
  renderHistory();
}

function setLoading(isLoading) {
  const submitButton = form.querySelector(".submit-btn");
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  submitButton.querySelector(".btn-text").textContent = isLoading ? "Predicting..." : "Predict price";
}

function validatePayload(payload) {
  const errors = [];
  form.querySelectorAll("input, select").forEach((field) => {
    const label = field.closest("label").innerText.trim();
    const value = Number(field.value);
    const min = Number(field.min);
    const max = Number(field.max);

    if (!field.value) {
      errors.push(`${label} is required.`);
    } else if (!Number.isFinite(value)) {
      errors.push(`${label} must be a valid number.`);
    } else if (field.min && value < min) {
      errors.push(`${label} must be at least ${min}.`);
    } else if (field.max && value > max) {
      errors.push(`${label} must be at most ${max}.`);
    }
  });

  return errors;
}

function loadFeatureImportance() {
  if (importanceData && !importanceData.textContent.includes("{{")) {
    try {
      return JSON.parse(importanceData.textContent);
    } catch (error) {
      return fallbackImportance;
    }
  }

  return fallbackImportance;
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
          label: "Feature importance",
          data: featureImportance.map((item) => item.importance),
          backgroundColor: [
            "#2dd4bf",
            "#60a5fa",
            "#a78bfa",
            "#fbbf24",
            "#fb7185",
            "#34d399",
            "#38bdf8",
            "#c084fc",
            "#f97316",
            "#94a3b8",
          ],
          borderRadius: 8,
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
          backgroundColor: "#07111f",
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
          ticks: { color: "#a8b4c7" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#c9d4e5", font: { weight: 700 } },
        },
      },
    },
  });
}

function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  counters.forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    if (!Number.isFinite(target)) return;

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      counter.textContent = formatNumber(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

document.querySelectorAll("[data-demo]").forEach((button) => {
  button.addEventListener("click", () => {
    const values = demos[button.dataset.demo];
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });
    setErrors([]);
    showToast(`${button.textContent.trim()} sample loaded.`);
  });
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(current);
  showToast(`${current === "light" ? "Light" : "Dark"} theme enabled.`);
});

clearHistoryButton.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
  showToast("Prediction history cleared.");
});

// Sends the prediction request to the existing Flask /predict endpoint.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setErrors([]);

  const payload = Object.fromEntries(new FormData(form).entries());
  const validationErrors = validatePayload(payload);

  if (validationErrors.length) {
    setErrors(validationErrors);
    showToast("Please fix the highlighted form values.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setErrors(data.errors || ["Prediction failed. Please check your inputs."]);
      showToast("Prediction failed. Check the form values.");
      return;
    }

    resultPrice.textContent = formatRupees(data.price);
    resultText.textContent = "Machine learning estimate generated from the submitted property profile.";
    resultTier.textContent = `${data.tier} property`;
    resultRange.textContent = `${formatRupees(data.range_low)} - ${formatRupees(data.range_high)}`;
    categoryPill.textContent = data.tier;
    rangeCard.classList.remove("hidden");
    addHistory(data);
    showToast("Prediction generated successfully.");
  } catch (error) {
    setErrors(["Could not connect to the prediction server. Run the Flask app and try again."]);
    showToast("Server connection failed.");
  } finally {
    setLoading(false);
  }
});

cleanTemplateFallbacks();
applyTheme(localStorage.getItem("pricewise-theme") || "dark");
renderHistory();
initCounters();
initRevealAnimations();
initChart();

if (window.lucide) {
  window.lucide.createIcons();
}
