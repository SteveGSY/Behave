// js/events.js
export function initEvents(state) {
  function addEvent(event) {
    state.events.push(event);
    state.events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    state.save();
  }

  function deleteEvent(id) {
    state.events = state.events.filter(e => String(e.id) !== String(id));
    state.save();
  }

  function getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const end = new Date(monday);
    end.setDate(end.getDate() + 7);
    return { start: monday, end };
  }

  function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  function calculateScore(range) {
    return state.events
      .filter(e => {
        const t = new Date(e.timestamp);
        return t >= range.start && t < range.end;
      })
      .reduce((sum, e) => sum + e.points, 0);
  }

  function getScores() {
    const today = calculateScore(getTodayRange());
    const week = calculateScore(getWeekRange());
    const total = state.events.reduce((sum, e) => sum + e.points, 0);
    return { today, week, total };
  }

  function computeStreaks() {
    if (!state.events.length) {
      return { current: 0, best: 0, positiveDays: 0 };
    }

    const map = new Map();
    state.events.forEach(e => {
      const d = new Date(e.timestamp);
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + e.points);
    });

    const days = Array.from(map.keys()).sort();
    let best = 0;
    let current = 0;
    let positiveDays = 0;

    let prevDate = null;
    days.forEach(key => {
      const total = map.get(key);
      if (total > 0) positiveDays++;

      const date = new Date(key);
      if (
        prevDate &&
        (date - prevDate) / (1000 * 60 * 60 * 24) === 1 &&
        total > 0
      ) {
        current++;
      } else if (total > 0) {
        current = 1;
      } else {
        current = 0;
      }
      if (current > best) best = current;
      prevDate = date;
    });

    return { current, best, positiveDays };
  }

  function getAchievements(streaks, scores) {
    const list = [];

    if (streaks.best >= 3) list.push("🔥 3+ day streak");
    if (streaks.best >= 7) list.push("🏆 7+ day streak");
    if (scores.today >= 5) list.push("⭐ Great day (5+ points)");
    if (scores.week >= 20) list.push("🌈 Strong week (20+ points)");
    if (scores.total >= 100) list.push("🎉 100+ total points");

    return list;
  }

  function getWeeklyReport() {
    const week = getWeekRange();
    const events = state.events.filter(e => {
      const t = new Date(e.timestamp);
      return t >= week.start && t < week.end;
    });

    const total = events.reduce((s, e) => s + e.points, 0);
    const positives = events.filter(e => e.points > 0).length;
    const negatives = events.filter(e => e.points < 0).length;

    const dayTotals = {};
    events.forEach(e => {
      const d = new Date(e.timestamp).toLocaleDateString("en-GB", {
        weekday: "short"
      });
      dayTotals[d] = (dayTotals[d] || 0) + e.points;
    });

    const bestDay =
      Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
    const worstDay =
      Object.entries(dayTotals).sort((a, b) => a[1] - b[1])[0] || ["None", 0];

    const categoryTotals = {};
    events.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.points;
    });

    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] ||
      ["None", 0];

    const streaks = computeStreaks();
    const achievements = getAchievements(streaks, {
      today: 0,
      week: total,
      total
    });

    return {
      total,
      positives,
      negatives,
      bestDay,
      worstDay,
      categoryTotals,
      topCategory,
      streaks,
      achievements
    };
  }

  function eventsToCSV() {
    const header = ["id", "type", "category", "points", "notes", "timestamp"];
    const rows = state.events.map(e => [
      e.id,
      e.type,
      e.category,
      e.points,
      (e.notes || "").replace(/"/g, '""'),
      e.timestamp
    ]);

    const csv = [header.join(",")]
      .concat(
        rows.map(r =>
          r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
        )
      )
      .join("\r\n");

    return csv;
  }

  function downloadCSV() {
    const csv = eventsToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10);
    a.href = url;
    a.download = `behaviour-data-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, ""));
    const idx = name => header.indexOf(name);

    const idIdx = idx("id");
    const typeIdx = idx("type");
    const catIdx = idx("category");
    const pointsIdx = idx("points");
    const notesIdx = idx("notes");
    const tsIdx = idx("timestamp");

    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const row = [];
      let cur = "";
      let inQuotes = false;
      const line = lines[i];

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"' && line[c + 1] === '"') {
          cur += '"';
          c++;
        } else if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          row.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      row.push(cur);

      if (row.length !== header.length) continue;

      const obj = {
        id:
          row[idIdx] ||
          (window.crypto && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now() + i),
        type: row[typeIdx] || "positive",
        category: row[catIdx] || "Other",
        points: Number(row[pointsIdx]) || 0,
        notes: row[notesIdx] || "",
        timestamp: row[tsIdx] || new Date().toISOString()
      };
      result.push(obj);
    }

    return result;
  }

  function importCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target.result;
        const imported = parseCSV(text);
        if (imported.length > 0) {
          state.events = imported.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          state.save();
          resolve(imported.length);
        } else {
          resolve(0);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return {
    addEvent,
    deleteEvent,
    getScores,
    computeStreaks,
    getAchievements,
    downloadCSV,
    importCSVFile,
    getTodayRange,
    getWeekRange,
    getMonthRange,
    getWeeklyReport
  };
}
