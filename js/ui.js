// js/ui.js
function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

function animateScore(id, type) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove("score-pop", "score-shake", "flash-green", "flash-red");
  void el.offsetWidth;

  if (type === "positive") {
    el.classList.add("score-pop", "flash-green");
  } else if (type === "negative") {
    el.classList.add("score-shake", "flash-red");
  }
}

export function initUI(state, api) {
  const todayEl = document.getElementById("todayScore");
  const weekEl = document.getElementById("weekScore");
  const totalEl = document.getElementById("totalScore");

  const currentStreakEl = document.getElementById("currentStreak");
  const bestStreakEl = document.getElementById("bestStreak");
  const positiveDaysEl = document.getElementById("positiveDays");
  const achievementsEl = document.getElementById("achievements");

  const trackerPage = document.getElementById("trackerPage");
  const chartsPage = document.getElementById("chartsPage");
  const reportPage = document.getElementById("reportPage");
  const tabTracker = document.getElementById("tabTracker");
  const tabCharts = document.getElementById("tabCharts");
  const tabReport = document.getElementById("tabReport");
  const backFromCharts = document.getElementById("backFromCharts");

  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");

  const sheet = document.getElementById("addSheet");
  const sheetBackdrop = document.getElementById("sheetBackdrop");
  const addFab = document.getElementById("addBehaviourFab");
  const form = document.getElementById("eventForm");

  const darkToggle = document.getElementById("darkModeToggle");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  function renderScoresAndStreaks() {
    const scores = api.getScores();
    const prevToday = Number(todayEl.textContent) || 0;
    const prevWeek = Number(weekEl.textContent) || 0;
    const prevTotal = Number(totalEl.textContent) || 0;

    if (scores.today !== prevToday) {
      const type = scores.today > prevToday ? "positive" : "negative";
      animateScore("todayScore", type);
    }
    if (scores.week !== prevWeek) {
      const type = scores.week > prevWeek ? "positive" : "negative";
      animateScore("weekScore", type);
    }
    if (scores.total !== prevTotal) {
      const type = scores.total > prevTotal ? "positive" : "negative";
      animateScore("totalScore", type);
    }

    todayEl.textContent = scores.today;
    weekEl.textContent = scores.week;
    totalEl.textContent = scores.total;

    const streaks = api.computeStreaks();
    currentStreakEl.textContent = streaks.current;
    bestStreakEl.textContent = streaks.best;
    positiveDaysEl.textContent = streaks.positiveDays;

    const achievements = api.getAchievements(streaks, scores);
    achievementsEl.innerHTML = achievements.length
      ? achievements.map(a => `<div>• ${a}</div>`).join("")
      : `<div class="text-slate-500 dark:text-slate-400">No achievements yet — keep going!</div>`;
  }

  function renderEventsTable() {
    const tbody = document.getElementById("eventsTableBody");
    tbody.innerHTML = "";

    [...state.events]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .forEach(e => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2 text-xs sm:text-sm">${new Date(
            e.timestamp
          ).toLocaleString()}</td>
          <td class="p-2 text-xs sm:text-sm ${
            e.type === "positive" ? "text-green-600" : "text-red-600"
          }">${e.type}</td>
          <td class="p-2 text-xs sm:text-sm">${e.category}</td>
          <td class="p-2 text-xs sm:text-sm">${e.points}</td>
          <td class="p-2 text-xs sm:text-sm">${e.notes || ""}</td>
          <td class="p-2 text-xs sm:text-sm">
            <button class="text-red-600 font-bold" data-delete="${e.id}">✖</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    tbody.addEventListener(
      "click",
      e => {
        const btn = e.target.closest("[data-delete]");
        if (!btn) return;
        const id = btn.getAttribute("data-delete");
        api.deleteEvent(id);
        haptic();
        render();
        if (state.renderCharts) state.renderCharts();
      },
      { once: true }
    );
  }

  function renderWeeklyReport() {
    const report = api.getWeeklyReport();

    document.getElementById("weeklySummary").innerHTML = `
      <div>Total points: <strong>${report.total}</strong></div>
      <div>Positive events: <strong>${report.positives}</strong></div>
      <div>Negative events: <strong>${report.negatives}</strong></div>
      <div>Best day: <strong>${report.bestDay[0]} (${report.bestDay[1]})</strong></div>
      <div>Hardest day: <strong>${report.worstDay[0]} (${report.worstDay[1]})</strong></div>
    `;

    const catHTML = Object.entries(report.categoryTotals)
      .map(([cat, pts]) => `<div>${cat}: <strong>${pts}</strong></div>`)
      .join("");

    document.getElementById("weeklyCategoryBreakdown").innerHTML =
      catHTML || "No data this week";

    document.getElementById("weeklyAchievements").innerHTML =
      report.achievements.length
        ? report.achievements.map(a => `<div>• ${a}</div>`).join("")
        : "No achievements this week";

    document.getElementById("weeklyShareText").value =
      `Weekly Behaviour Report\n\n` +
      `Total points: ${report.total}\n` +
      `Best day: ${report.bestDay[0]} (${report.bestDay[1]})\n` +
      `Top category: ${report.topCategory[0]} (${report.topCategory[1]})\n` +
      `Achievements: ${report.achievements.join(", ") || "None"}\n`;
  }

  function render() {
    renderScoresAndStreaks();
    renderEventsTable();
  }

  function showTracker() {
    trackerPage.classList.remove("hidden");
    chartsPage.classList.add("hidden");
    reportPage.classList.add("hidden");

    trackerPage.classList.add("active");
    chartsPage.classList.remove("active");
    reportPage.classList.remove("active");

    backFromCharts.classList.add("hidden");
    tabTracker.classList.add("floating-btn-active");
    tabCharts.classList.remove("floating-btn-active");
    tabReport.classList.remove("floating-btn-active");
  }

  function showCharts() {
    trackerPage.classList.add("hidden");
    chartsPage.classList.remove("hidden");
    reportPage.classList.add("hidden");

    chartsPage.classList.add("active");
    trackerPage.classList.remove("active");
    reportPage.classList.remove("active");

    backFromCharts.classList.remove("hidden");
    tabCharts.classList.add("floating-btn-active");
    tabTracker.classList.remove("floating-btn-active");
    tabReport.classList.remove("floating-btn-active");

    if (state.renderCharts) state.renderCharts();
  }

  function showReport() {
    trackerPage.classList.add("hidden");
    chartsPage.classList.add("hidden");
    reportPage.classList.remove("hidden");

    reportPage.classList.add("active");
    trackerPage.classList.remove("active");
    chartsPage.classList.remove("active");

    backFromCharts.classList.remove("hidden");
    tabReport.classList.add("floating-btn-active");
    tabTracker.classList.remove("floating-btn-active");
    tabCharts.classList.remove("floating-btn-active");

    renderWeeklyReport();
  }

  tabTracker.addEventListener("click", () => {
    showTracker();
    haptic();
  });
  tabCharts.addEventListener("click", () => {
    showCharts();
    haptic();
  });
  tabReport.addEventListener("click", () => {
    showReport();
    haptic();
  });
  backFromCharts.addEventListener("click", () => {
    showTracker();
    haptic();
  });

  function openSheet() {
    sheet.classList.add("active");
    sheetBackdrop.classList.add("active");
  }
  function closeSheet() {
    sheet.classList.remove("active");
    sheetBackdrop.classList.remove("active");
  }

  addFab.addEventListener("click", () => {
    openSheet();
    haptic();
  });
  sheetBackdrop.addEventListener("click", closeSheet);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const type = form.elements["type"].value;
    const category = document.getElementById("category").value;
    let points = Math.abs(
      parseInt(document.getElementById("points").value, 10) || 0
    );
    points = type === "negative" ? -points : points;
    const notes = document.getElementById("notes").value;

    const id =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + Math.random();

    api.addEvent({
      id,
      type,
      category,
      points,
      notes,
      timestamp: new Date().toISOString()
    });

    document.getElementById("notes").value = "";
    haptic();
    render();
    if (state.renderCharts) state.renderCharts();
    closeSheet();
  });

  form.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [type, category, pts] = btn
        .getAttribute("data-quick")
        .split(":");
      const id =
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now() + Math.random();
      api.addEvent({
        id,
        type,
        category,
        points: type === "negative" ? -Math.abs(Number(pts)) : Number(pts),
        notes: "",
        timestamp: new Date().toISOString()
      });
      haptic();
      render();
      if (state.renderCharts) state.renderCharts();
    });
  });

  exportBtn.addEventListener("click", () => {
    api.downloadCSV();
    haptic();
  });
  importInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (file) {
      const count = await api.importCSVFile(file);
      render();
      if (state.renderCharts) state.renderCharts();
      alert(
        count > 0
          ? `Imported ${count} records.`
          : "No valid records found in CSV."
      );
      e.target.value = "";
    }
  });

  darkToggle.addEventListener("click", () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("hb-theme", isDark ? "dark" : "light");
    darkToggle.textContent = isDark ? "Light" : "Dark";
    haptic();
  });
  darkToggle.textContent = document.documentElement.classList.contains("dark")
    ? "Light"
    : "Dark";

  function toggleFullscreen() {
    const doc = document;
    const docEl = document.documentElement;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (docEl.requestFullscreen) docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    }
  }

  fullscreenBtn.addEventListener("click", () => {
    toggleFullscreen();
    haptic();
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.textContent = document.fullscreenElement
      ? "Exit"
      : "Fullscreen";
  });

  render();
}
