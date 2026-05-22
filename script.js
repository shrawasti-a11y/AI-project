const form = document.querySelector("#predict-form");
const errorBox = document.querySelector("#error-box");
const resultPrice = document.querySelector("#result-price");
const resultText = document.querySelector("#result-text");
const rangeCard = document.querySelector("#range-card");
const resultTier = document.querySelector("#result-tier");
const resultRange = document.querySelector("#result-range");

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

function setErrors(errors) {
  if (!errors.length) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
    return;
  }

  errorBox.classList.remove("hidden");
  errorBox.innerHTML = errors.map((error) => `<div>${error}</div>`).join("");
}

document.querySelectorAll("[data-demo]").forEach((button) => {
  button.addEventListener("click", () => {
    const values = demos[button.dataset.demo];
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) field.value = value;
    });
    setErrors([]);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setErrors([]);

  const submitButton = form.querySelector(".submit-btn");
  const payload = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  submitButton.textContent = "Predicting...";

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setErrors(data.errors || ["Prediction failed. Please check your inputs."]);
      return;
    }

    resultPrice.textContent = formatNumber(data.price);
    resultText.textContent = "Predicted price output in INR.";
    resultTier.textContent = `${data.tier} property`;
    resultRange.textContent = `${formatRupees(data.range_low)} - ${formatRupees(data.range_high)}`;
    rangeCard.classList.remove("hidden");
  } catch (error) {
    setErrors(["Could not connect to the prediction server."]);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Predict price";
  }
});

const chartCanvas = document.querySelector("#importance-chart");
if (chartCanvas && window.FEATURE_IMPORTANCE) {
  new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: window.FEATURE_IMPORTANCE.map((item) => item.feature),
      datasets: [
        {
          label: "Feature importance",
          data: window.FEATURE_IMPORTANCE.map((item) => item.importance),
          backgroundColor: ["#0f766e", "#13293d", "#c58a24", "#c25a43", "#496a81", "#6f7d4f", "#8a6f3d", "#2f8178", "#7b8794", "#9b5f4a"],
          borderColor: "#ffffff",
          borderWidth: 1,
          borderRadius: 6,
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
          backgroundColor: "#13293d",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          padding: 12,
          displayColors: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#edf1f4" },
          ticks: { color: "#637282" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#465462", font: { weight: 700 } },
        },
      },
    },
  });
}
