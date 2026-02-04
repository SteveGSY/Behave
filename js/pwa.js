// js/pwa.js
export function initPWA(state, api) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/Behave/service-worker.js")
        .catch(console.error);
    });

    navigator.serviceWorker.addEventListener("message", event => {
      if (event.data === "UPDATE_AVAILABLE") {
        const banner = document.getElementById("updateBanner");
        if (!banner) return;
        banner.classList.remove("hidden");
        banner.addEventListener(
          "click",
          () => {
            location.reload();
          },
          { once: true }
        );
      }
    });
  }
}
