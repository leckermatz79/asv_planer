(function () {

  const TABS = ["chemo", "support", "gcsf", "import-export", "einstellungen"];
  const DEFAULT_TAB = "chemo";

  function getActiveTabFromHash() {
    const hash = location.hash.replace("#", "");
    return TABS.includes(hash) ? hash : DEFAULT_TAB;
  }

  function activateTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "tab-" + tabId);
    });
    history.replaceState(null, "", "#" + tabId);
  }

  function init() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    window.addEventListener("hashchange", () => activateTab(getActiveTabFromHash()));

    activateTab(getActiveTabFromHash());
  }

  document.addEventListener("DOMContentLoaded", init);

})();
