// js/gestures.js
export function initGestures(state, api) {
  const main = document.getElementById("mainContainer");
  const trackerPage = document.getElementById("trackerPage");
  const chartsPage = document.getElementById("chartsPage");
  const reportPage = document.getElementById("reportPage");

  let startX = null;
  let startY = null;

  function onTouchStart(e) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }

  function onTouchEnd(e) {
    if (startX === null || startY === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && trackerPage.classList.contains("active")) {
        document.getElementById("tabCharts").click();
      } else if (dx < 0 && chartsPage.classList.contains("active")) {
        document.getElementById("tabReport").click();
      } else if (dx > 0 && reportPage.classList.contains("active")) {
        document.getElementById("tabCharts").click();
      } else if (dx > 0 && chartsPage.classList.contains("active")) {
        document.getElementById("tabTracker").click();
      }
    }

    startX = null;
    startY = null;
  }

  main.addEventListener("touchstart", onTouchStart, { passive: true });
  main.addEventListener("touchend", onTouchEnd, { passive: true });
}
