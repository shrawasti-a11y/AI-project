/* ==========================================================================
   script.js — PriceWise India v2
   ========================================================================== */
"use strict";
 
/* ── THEME ──────────────────────────────────────────────────────────────── */
let isDark = true;
const themeBtn  = document.getElementById("theme-btn");
const themeIcon = document.getElementById("theme-icon");
 
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  themeIcon.className = isDark ? "ti ti-sun" : "ti ti-moon";
  localStorage.setItem("pw-theme", isDark ? "dark" : "light");
  if (window._chart) {
    const tickColor = isDark ? "#64748b" : "#94a3b8";
    window._chart.options.scales.x.ticks.color = tickColor;
    window._chart.options.scales.y.ticks.color = isDark ? "#94a3b8" : "#64748b";
    window._chart.update();
  }
}
 
// Restore saved theme
(function () {
  const saved = localStorage.getItem("pw-theme");
  if (saved === "light") {
    isDark = false;
    document.documentElement.setAttribute("data-theme", "light");
    themeIcon.className = "ti ti-moon";
  }
})();
 
if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
 
/* ── NAV ACTIVE ──────────────────────────────────────────────────────────── */
const navLinks = document.querySelectorAll(".nav-link");
const sections = ["predict-section", "stats-section", "about-section"];
window.addEventListener("scroll", () => {
  let current = "predict-section";
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  navLinks.forEach(l => {
    l.classList.toggle("active", l.getAttribute("href") === "#" + current);
  });
}, { passive: true });
 
/* ── FEATURE IMPORTANCE CHART ─────────────────────────────────────────── */
(function initChart() {
  const fi = window.FEAT_IMP;
  if (!fi || !fi.length) return;
  const canvas = document.getElementById("importanceChart");
  if (!canvas) return;
  const colors = [
    "rgba(59,130,246,.85)","rgba(99,102,241,.85)","rgba(139,92,246,.85)",
    "rgba(16,185,129,.85)","rgba(245,158,11,.85)","rgba(244,63,94,.85)",
    "rgba(20,184,166,.85)","rgba(249,115,22,.85)","rgba(52,211,153,.85)",
    "rgba(167,139,250,.85)",
  ];
  window._chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: fi.map(f => f.label),
      datasets: [{
        label: "Importance (%)",
        data: fi.map(f => f.value),
        backgroundColor: colors.slice(0, fi.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}%` },
          backgroundColor: "#1a2235",
          borderColor: "rgba(255,255,255,.1)",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.04)" },
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
 
/* ── DEMOS ────────────────────────────────────────────────────────────────── */
const DEMOS = {
  budget:  { numberOfBedrooms:2, numberOfBathrooms:1,   livingArea:900,  lotArea:3500,  numberOfFloors:1,   conditionOfTheHouse:2, BuiltYear:1988, PostalCode:122006, NumberOfSchoolsNearby:1, DistanceFromTheAirport:75 },
  midrange:{ numberOfBedrooms:3, numberOfBathrooms:2.5, livingArea:2100, lotArea:7200,  numberOfFloors:2,   conditionOfTheHouse:3, BuiltYear:2002, PostalCode:122032, NumberOfSchoolsNearby:3, DistanceFromTheAirport:52 },
  luxury:  { numberOfBedrooms:5, numberOfBathrooms:4,   livingArea:5500, lotArea:15000, numberOfFloors:2.5, conditionOfTheHouse:5, BuiltYear:2018, PostalCode:122001, NumberOfSchoolsNearby:5, DistanceFromTheAirport:30 },
};
 
function fillDemo(type, btn) {
  document.querySelectorAll(".demo-pill").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const d = DEMOS[type]; if (!d) return;
  Object.keys(d).forEach(k => {
    const el = document.getElementById(k);
    if (el) { el.value = d[k]; el.classList.remove("error"); }
  });
  document.getElementById("error-box").classList.add("hidden");
}
 
/* ── VALIDATION ────────────────────────────────────────────────────────────── */
const FIELDS = [
  { id:"numberOfBedrooms",       label:"Bedrooms",             min:1,      max:20      },
  { id:"numberOfBathrooms",      label:"Bathrooms",            min:0.5,    max:10      },
  { id:"livingArea",             label:"Living Area",          min:200,    max:15000   },
  { id:"lotArea",                label:"Lot Area",             min:400,    max:1100000 },
  { id:"numberOfFloors",         label:"Floors",               min:1,      max:4       },
  { id:"conditionOfTheHouse",    label:"Condition",            min:1,      max:5       },
  { id:"BuiltYear",              label:"Year Built",           min:1900,   max:2024    },
  { id:"PostalCode",             label:"Postal Code",          min:100000, max:200000  },
  { id:"NumberOfSchoolsNearby",  label:"Schools Nearby",       min:0,      max:10      },
  { id:"DistanceFromTheAirport", label:"Airport Distance",     min:1,      max:200     },
];
 
function validateForm() {
  const errors = [];
  document.querySelectorAll(".form-input").forEach(i => i.classList.remove("error"));
  FIELDS.forEach(({ id, label, min, max }) => {
    const el = document.getElementById(id); if (!el) return;
    const v = parseFloat(el.value);
    if (el.value === "" || isNaN(v)) {
      errors.push(`${label} is required.`); el.classList.add("error");
    } else if (v < min || v > max) {
      errors.push(`${label} must be between ${min} and ${max}.`); el.classList.add("error");
    }
  });
  if (errors.length) {
    document.getElementById("error-list").innerHTML = errors.map(e => `<li>${e}</li>`).join("");
    const box = document.getElementById("error-box");
    box.classList.remove("hidden");
    box.scrollIntoView({ behavior:"smooth", block:"nearest" });
    return false;
  }
  return true;
}
 
/* ── PREDICTION ────────────────────────────────────────────────────────────── */
let lastResult = null, lastInputs = null;
 
function getFormData() {
  const out = {};
  FIELDS.forEach(({ id }) => { out[id] = parseFloat(document.getElementById(id).value); });
  return out;
}
 
function formatINR(n) {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
 
function tierLabel(p) {
  if (p < 200000)  return "🏠 Budget Segment";
  if (p < 600000)  return "🏘️ Mid-Range Segment";
  if (p < 1500000) return "🏡 Premium Segment";
  return "🏰 Luxury Segment";
}
 
async function submitPrediction() {
  if (!validateForm()) return;
  document.getElementById("error-box").classList.add("hidden");
  const btn = document.getElementById("predict-btn");
  const txt = document.getElementById("btn-text");
  const ldr = document.getElementById("btn-loader");
  btn.disabled = true; txt.classList.add("hidden"); ldr.classList.remove("hidden");
  const inputs = getFormData();
  lastInputs = inputs;
  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Prediction failed.");
    lastResult = data;
    showResult(data, inputs);
  } catch (err) {
    document.getElementById("error-list").innerHTML = `<li>${err.message}</li>`;
    document.getElementById("error-box").classList.remove("hidden");
  } finally {
    btn.disabled = false; txt.classList.remove("hidden"); ldr.classList.add("hidden");
  }
}
 
function showResult(data, inputs) {
  const { price, low, high } = data;
  document.getElementById("result-placeholder").classList.add("hidden");
  const card = document.getElementById("result-card");
  card.classList.remove("hidden");
  card.classList.add("result-reveal");
  setTimeout(() => card.classList.remove("result-reveal"), 600);
 
  document.getElementById("result-price").textContent = formatINR(price);
  document.getElementById("result-tier").textContent  = tierLabel(price);
  document.getElementById("range-low").textContent    = formatINR(low);
  document.getElementById("range-high").textContent   = formatINR(high);
 
  const range = high - low;
  const pct   = range > 0 ? Math.round(((price - low) / range) * 100) : 50;
  document.getElementById("conf-fill").style.width   = "60%";
  document.getElementById("conf-marker").style.left  = Math.min(Math.max(pct, 5), 95) + "%";
 
  const labels = { numberOfBedrooms:"Bedrooms", numberOfBathrooms:"Bathrooms", livingArea:"Living Area", lotArea:"Lot Area", numberOfFloors:"Floors", conditionOfTheHouse:"Condition", BuiltYear:"Year Built", PostalCode:"Postal Code", NumberOfSchoolsNearby:"Schools", DistanceFromTheAirport:"Airport (km)" };
  const units  = { livingArea:" sq ft", lotArea:" sq ft" };
  document.getElementById("result-summary").innerHTML =
    Object.keys(labels).map(k => `
      <div class="sum-row">
        <span class="sum-key">${labels[k]}</span>
        <span class="sum-val">${inputs[k]}${units[k] || ""}</span>
      </div>`).join("");
 
  card.scrollIntoView({ behavior:"smooth", block:"nearest" });
}
 
function copyResult() {
  const p = document.getElementById("result-price").textContent;
  const l = document.getElementById("range-low").textContent;
  const h = document.getElementById("range-high").textContent;
  const t = document.getElementById("result-tier").textContent;
  navigator.clipboard.writeText(`PriceWise India — AI Estimate\nPrice: ${p}\nRange: ${l} – ${h}\nSegment: ${t}`).then(() => {
    const lbl = document.getElementById("copy-lbl");
    lbl.textContent = "Copied!";
    setTimeout(() => { lbl.textContent = "Copy"; }, 2000);
  });
}
 
function askAboutResult() {
  if (!lastResult) return;
  const p = formatINR(lastResult.price);
  const t = tierLabel(lastResult.price);
  toggleChat(true);
  setTimeout(() => {
    document.getElementById("chat-input").value =
      `I got an estimate of ${p} (${t}). What factors drove this price and how can I improve the property value?`;
    sendChat();
  }, 400);
}
 
function resetForm() {
  FIELDS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) { el.value = ""; el.classList.remove("error"); }
  });
  document.getElementById("error-box").classList.add("hidden");
  document.getElementById("result-placeholder").classList.remove("hidden");
  document.getElementById("result-card").classList.add("hidden");
  document.querySelectorAll(".demo-pill").forEach(b => b.classList.remove("active"));
  lastResult = null; lastInputs = null;
}
 
/* ── CHATBOT ──────────────────────────────────────────────────────────────── */
let chatOpen = false, chatHistory = [], isBotTyping = false;
 
const SYSTEM_PROMPT = `You are PriceWise AI, an expert Indian real estate assistant integrated into a house price prediction website. You help users with:
- Understanding Indian real estate pricing and market trends
- Interpreting price estimates and confidence ranges from our Random Forest model
- Property valuation factors: location, size, condition, age, amenities, airport proximity, schools
- Tips to improve property value
- Explaining how the ML model works (Random Forest with 77% R² accuracy, trained on 14,619 transactions)
- Comparing properties and segments (Budget <₹20L, Mid-Range ₹20-60L, Premium ₹60L-1.5Cr, Luxury >₹1.5Cr)
 
Be helpful, concise, and accurate. Use ₹ for prices. Keep responses under 200 words unless more detail is needed. Be friendly and professional. Respond in a conversational tone.`;
 
function toggleChat(forceOpen) {
  chatOpen = (forceOpen === true) ? true : !chatOpen;
  const win = document.getElementById("chat-window");
  const fab = document.getElementById("chat-fab");
  if (chatOpen) {
    win.classList.remove("hidden");
    fab.classList.add("open");
    fab.innerHTML = '<i class="ti ti-x"></i>';
    if (chatHistory.length === 0) {
      addBotMsg("Hi! I'm PriceWise AI 🏡\n\nI can help you understand Indian real estate pricing, explain your estimates, or answer questions about the model. What would you like to know?");
    }
    setTimeout(() => document.getElementById("chat-input").focus(), 300);
  } else {
    win.classList.add("hidden");
    fab.classList.remove("open");
    fab.innerHTML = '<i class="ti ti-message-chatbot"></i>';
  }
}
 
function addBotMsg(text) {
  chatHistory.push({ role:"assistant", content:text });
  renderMessages();
}
function addUserMsg(text) {
  chatHistory.push({ role:"user", content:text });
  renderMessages();
}
 
function renderMessages() {
  const container = document.getElementById("chat-messages");
  container.innerHTML = chatHistory.map(m => `
    <div class="msg ${m.role === "user" ? "user" : "bot"}">
      <div class="msg-avatar">${m.role === "user" ? "U" : "AI"}</div>
      <div><div class="msg-bubble">${m.content.replace(/\n/g, "<br>")}</div></div>
    </div>`).join("");
  if (isBotTyping) {
    container.innerHTML += `<div class="msg bot"><div class="msg-avatar">AI</div><div class="msg-bubble typing-dots"><span></span><span></span><span></span></div></div>`;
  }
  container.scrollTop = container.scrollHeight;
  if (chatHistory.length > 2) {
    document.getElementById("chat-suggestions").style.display = "none";
  }
}
 
async function sendChat() {
  const input = document.getElementById("chat-input");
  const text  = input.value.trim();
  if (!text || isBotTyping) return;
  input.value = "";
  input.style.height = "";
  addUserMsg(text);
  isBotTyping = true;
  renderMessages();
  document.getElementById("chat-send").disabled = true;
 
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory, system: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    const reply = data.reply || "I'm having trouble responding. Please try again.";
    isBotTyping = false;
    addBotMsg(reply);
  } catch {
    isBotTyping = false;
    addBotMsg("Connection issue — make sure the Flask server is running with Anthropic API configured.");
  }
  document.getElementById("chat-send").disabled = false;
}
 
function sendSuggestion(text) {
  document.getElementById("chat-input").value = text;
  sendChat();
}
 
function handleChatKey(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
}
 
function autoResizeTA(el) {
  el.style.height = "";
  el.style.height = Math.min(el.scrollHeight, 90) + "px";
}
