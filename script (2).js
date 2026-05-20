/* ==========================================================================
   script.js — PriceWise India
   Handles: particle bg, counter animation, Chart.js, prediction fetch, demos
   ========================================================================== */
 
"use strict";
 
/* ── 1. PARTICLE BACKGROUND ─────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
 
  let W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;
 
  const COLORS = ["#3b82f6", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b"];
  const COUNT  = Math.min(60, Math.floor((W * H) / 20000));
 
  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    vx: (Math.random() - .5) * .4,
    vy: (Math.random() - .5) * .4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.5 + 0.1,
  }));
 
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
 
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
 
    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = particles[i].color;
          ctx.globalAlpha = (1 - dist / 120) * 0.12;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
 
    requestAnimationFrame(draw);
  }
  draw();
 
  window.addEventListener("resize", () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  });
})();
 
 
/* ── 2. ANIMATED COUNTER ─────────────────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll(".counter");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.target, 10);
      const dur = 1500;
      const step = end / (dur / 16);
      let cur = 0;
      const tick = () => {
        cur = Math.min(cur + step, end);
        el.textContent = Math.floor(cur).toLocaleString("en-IN");
        if (cur < end) requestAnimationFrame(tick);
      };
      tick();
      observer.unobserve(el);
    });
  }, { threshold: .3 });
  counters.forEach(c => observer.observe(c));
})();
 
 
/* ── 3. FEATURE IMPORTANCE CHART ─────────────────────────────────────────── */
(function initChart() {
  const fi = window.FEAT_IMP;
  if (!fi || !fi.length) return;
 
  const labels = fi.map(f => f.label);
  const values = fi.map(f => f.value);
 
  const colors = [
    "rgba(59,130,246,.85)",
    "rgba(139,92,246,.85)",
    "rgba(16,185,129,.85)",
    "rgba(245,158,11,.85)",
    "rgba(244,63,94,.85)",
    "rgba(20,184,166,.85)",
    "rgba(249,115,22,.85)",
    "rgba(251,191,36,.85)",
    "rgba(52,211,153,.85)",
    "rgba(167,139,250,.85)",
  ];
 
  const canvas = document.getElementById("importanceChart");
  if (!canvas) return;
 
  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Importance (%)",
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 7,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x.toFixed(1)}%`,
          },
          backgroundColor: "#1a2235",
          borderColor: "rgba(255,255,255,.1)",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.05)" },
          ticks: { color: "#64748b", font: { size: 11 }, callback: v => v + "%" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#94a3b8", font: { size: 11 } },
        },
      },
    },
  });
})();
 
 
/* ── 4. DEMO PRESETS ─────────────────────────────────────────────────────── */
const DEMOS = {
  budget: {
    numberOfBedrooms: 2, numberOfBathrooms: 1, livingArea: 900,
    lotArea: 3500, numberOfFloors: 1, conditionOfTheHouse: 2,
    BuiltYear: 1988, PostalCode: 122006, NumberOfSchoolsNearby: 1,
    DistanceFromTheAirport: 75,
  },
  midrange: {
    numberOfBedrooms: 3, numberOfBathrooms: 2.5, livingArea: 2100,
    lotArea: 7200, numberOfFloors: 2, conditionOfTheHouse: 3,
    BuiltYear: 2002, PostalCode: 122032, NumberOfSchoolsNearby: 3,
    DistanceFromTheAirport: 52,
  },
  luxury: {
    numberOfBedrooms: 5, numberOfBathrooms: 4, livingArea: 5500,
    lotArea: 15000, numberOfFloors: 2.5, conditionOfTheHouse: 5,
    BuiltYear: 2018, PostalCode: 122001, NumberOfSchoolsNearby: 5,
    DistanceFromTheAirport: 30,
  },
};
 
function fillDemo(type) {
  const d = DEMOS[type];
  if (!d) return;
  Object.keys(d).forEach(key => {
    const el = document.getElementById(key);
    if (el) {
      el.value = d[key];
      el.classList.remove("error");
    }
  });
  hideError();
}
 
 
/* ── 5. VALIDATION ───────────────────────────────────────────────────────── */
const FIELDS = [
  { id: "numberOfBedrooms",      label: "Bedrooms",              min: 1,      max: 20,      step: 1    },
  { id: "numberOfBathrooms",     label: "Bathrooms",             min: 0.5,    max: 10,      step: 0.25 },
  { id: "livingArea",            label: "Living Area",           min: 200,    max: 15000,   step: 1    },
  { id: "lotArea",               label: "Lot Area",              min: 400,    max: 1100000, step: 1    },
  { id: "numberOfFloors",        label: "Floors",                min: 1,      max: 4,       step: 0.5  },
  { id: "conditionOfTheHouse",   label: "Condition",             min: 1,      max: 5,       step: 1    },
  { id: "BuiltYear",             label: "Year Built",            min: 1900,   max: 2024,    step: 1    },
  { id: "PostalCode",            label: "Postal Code",           min: 100000, max: 200000,  step: 1    },
  { id: "NumberOfSchoolsNearby", label: "Schools Nearby",        min: 0,      max: 10,      step: 1    },
  { id: "DistanceFromTheAirport",label: "Distance from Airport", min: 1,      max: 200,     step: 1    },
];
 
function validateForm() {
  const errors = [];
  document.querySelectorAll(".form-input").forEach(i => i.classList.remove("error"));
 
  FIELDS.forEach(({ id, label, min, max }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = parseFloat(el.value);
    if (el.value === "" || isNaN(v)) {
      errors.push(`${label} is required.`);
      el.classList.add("error");
    } else if (v < min || v > max) {
      errors.push(`${label} must be between ${min} and ${max}.`);
      el.classList.add("error");
    }
  });
 
  if (errors.length) {
    const box  = document.getElementById("error-box");
    const list = document.getElementById("error-list");
    list.innerHTML = errors.map(e => `<li>${e}</li>`).join("");
    box.classList.remove("hidden");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return false;
  }
  return true;
}
 
function hideError() {
  document.getElementById("error-box").classList.add("hidden");
}
 
 
/* ── 6. PREDICTION ───────────────────────────────────────────────────────── */
function getFormData() {
  const out = {};
  FIELDS.forEach(({ id }) => {
    out[id] = parseFloat(document.getElementById(id).value);
  });
  return out;
}
 
function formatINR(n) {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
 
function tierLabel(price) {
  if (price < 200000)  return "🏠 Budget Segment";
  if (price < 600000)  return "🏘 Mid-Range Segment";
  if (price < 1500000) return "🏡 Premium Segment";
  return "🏰 Luxury Segment";
}
 
async function submitPrediction() {
  if (!validateForm()) return;
  hideError();
 
  const btn    = document.getElementById("predict-btn");
  const txt    = document.getElementById("btn-text");
  const loader = document.getElementById("btn-loader");
 
  btn.disabled = true;
  txt.classList.add("hidden");
  loader.classList.remove("hidden");
 
  try {
    const payload = getFormData();
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
 
    if (!data.success) throw new Error(data.error || "Prediction failed.");
 
    showResult(data, payload);
  } catch (err) {
    const box  = document.getElementById("error-box");
    const list = document.getElementById("error-list");
    list.innerHTML = `<li>${err.message}</li>`;
    box.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    txt.classList.remove("hidden");
    loader.classList.add("hidden");
  }
}
 
function showResult(data, inputs) {
  const { price, low, high } = data;
 
  // Hide placeholder, show card
  document.getElementById("result-placeholder").classList.add("hidden");
  const card = document.getElementById("result-card");
  card.classList.remove("hidden");
 
  // Price
  document.getElementById("result-price").textContent = formatINR(price);
  document.getElementById("result-tier").textContent  = tierLabel(price);
  document.getElementById("result-sub");
 
  // Confidence range
  document.getElementById("range-low").textContent  = formatINR(low);
  document.getElementById("range-high").textContent = formatINR(high);
 
  // Confidence bar — show predicted position within [low, high]
  const range  = high - low;
  const pct    = range > 0 ? Math.round(((price - low) / range) * 100) : 50;
  const barPct = 60; // bar covers 60% of track width (centered)
  document.getElementById("conf-bar").style.width = barPct + "%";
  document.getElementById("conf-marker").style.left = Math.min(Math.max(pct, 5), 95) + "%";
 
  // Summary
  const labels = {
    numberOfBedrooms:       "Bedrooms",
    numberOfBathrooms:      "Bathrooms",
    livingArea:             "Living Area",
    lotArea:                "Lot Area",
    numberOfFloors:         "Floors",
    conditionOfTheHouse:    "Condition",
    BuiltYear:              "Year Built",
    PostalCode:             "Postal Code",
    NumberOfSchoolsNearby:  "Schools Nearby",
    DistanceFromTheAirport: "Airport Dist (km)",
  };
  const units = {
    livingArea: " sq ft", lotArea: " sq ft",
  };
 
  const summaryDiv = document.getElementById("result-summary");
  summaryDiv.innerHTML = Object.keys(labels).map(key => {
    const v = inputs[key];
    const u = units[key] || "";
    return `
      <div class="summary-row">
        <span class="summary-key">${labels[key]}</span>
        <span class="summary-val">${v}${u}</span>
      </div>`;
  }).join("");
 
  // Scroll to result
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
 
 
/* ── 7. COPY RESULT ──────────────────────────────────────────────────────── */
function copyResult() {
  const price = document.getElementById("result-price").textContent;
  const low   = document.getElementById("range-low").textContent;
  const high  = document.getElementById("range-high").textContent;
  const tier  = document.getElementById("result-tier").textContent;
  const text  = `PriceWise India — AI Estimate\nPrice: ${price}\nRange: ${low} – ${high}\nSegment: ${tier}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "✓ Copied!";
    setTimeout(() => { btn.textContent = "📋 Copy Result"; }, 2000);
  });
}
 
 
/* ── 8. RESET ────────────────────────────────────────────────────────────── */
function resetForm() {
  FIELDS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) { el.value = ""; el.classList.remove("error"); }
  });
  hideError();
  document.getElementById("result-placeholder").classList.remove("hidden");
  document.getElementById("result-card").classList.add("hidden");
}
