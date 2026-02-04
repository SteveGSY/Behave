// js/charts.js
let weeklyChart, dailyChart, monthlyChart, categoryChart;

export function initCharts(state, api) {
  function getDailyTotals() {
    const today = api.getTodayRange();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const totals = hours.map(h =>
      state.events
        .filter(e => {
          const t = new Date(e.timestamp);
          return t >= today.start && t < today.end && t.getHours() === h;
        })
        .reduce((sum, e) => sum + e.points, 0)
    );

    return { hours, totals };
  }

  function getWeeklyTotals() {
    const week = api.getWeekRange();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const totals = days.map((_, i) => {
      const dayStart = new Date(week.start);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      return state.events
        .filter(e => {
          const t = new Date(e.timestamp);
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, e) => sum + e.points, 0);
    });

    return { days, totals };
  }

  function getMonthlyTotals() {
    const month = api.getMonthRange();
    const daysInMonth = new Date(
      month.start.getFullYear(),
      month.start.getMonth() + 1,
      0
    ).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const totals = labels.map(d => {
      const dayStart = new Date(
        month.start.getFullYear(),
        month.start.getMonth(),
        d
      );
      const dayEnd = new Date(
        month.start.getFullYear(),
        month.start.getMonth(),
        d + 1
      );

      return state.events
        .filter(e => {
          const t = new Date(e.timestamp);
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, e) => sum + e.points, 0);
    });

    return { labels, totals };
  }

  function getCategoryTotals() {
    const map = {};
    state.events.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.points;
    });
    const labels = Object.keys(map);
    const totals = labels.map(l => map[l]);
    return { labels, totals };
  }

  function renderCharts() {
    const weekly = getWeeklyTotals();
    const daily = getDailyTotals();
    const monthly = getMonthlyTotals();
    const category = getCategoryTotals();

    const weeklyCtx = document.getElementById("weeklyChart");
    const dailyCtx = document.getElementById("dailyChart");
    const monthlyCtx = document.getElementById("monthlyChart");
    const categoryCtx = document.getElementById("categoryChart");
    if (!weeklyCtx || !dailyCtx || !monthlyCtx || !categoryCtx) return;

    if (weeklyChart) weeklyChart.destroy();
    if (dailyChart) dailyChart.destroy();
    if (monthlyChart) monthlyChart.destroy();
    if (categoryChart) categoryChart.destroy();

    weeklyChart = new Chart(weeklyCtx, {
      type: "bar",
      data: {
        labels: weekly.days,
        datasets: [
          {
            label: "Points",
            data: weekly.totals,
            backgroundColor: "#2563eb88",
            borderColor: "#2563eb",
            borderWidth: 2
          }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    dailyChart = new Chart(dailyCtx, {
      type: "line",
      data: {
        labels: daily.hours.map(h => `${h}:00`),
        datasets: [
          {
            label: "Points",
            data: daily.totals,
            borderColor: "#16a34a",
            backgroundColor: "#16a34a55",
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    monthlyChart = new Chart(monthlyCtx, {
      type: "bar",
      data: {
        labels: monthly.labels,
        datasets: [
          {
            label: "Points",
            data: monthly.totals,
            backgroundColor: "#f9731688",
            borderColor: "#f97316",
            borderWidth: 2
          }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    categoryChart = new Chart(categoryCtx, {
      type: "pie",
      data: {
        labels: category.labels,
        datasets: [
          {
            data: category.totals,
            backgroundColor: [
              "#2563eb88",
              "#16a34a88",
              "#f9731688",
              "#e11d4888",
              "#a855f788"
            ],
            borderColor: "#ffffff",
            borderWidth: 2
          }
        ]
      },
      options: { responsive: true }
    });
  }

  state.renderCharts = renderCharts;
}
