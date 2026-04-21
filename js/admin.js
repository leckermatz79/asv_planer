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

  /* ─── Settings ──────────────────────────────────────────────────────────── */

  function loadSettingsFromConfig() {
    const c = Config.getAll();
    document.getElementById("cfg-storage-mode").value   = c.storage.mode;
    document.getElementById("cfg-language").value       = c.ui.language;
    document.getElementById("cfg-clinic-name").value    = c.ui.clinicName;
    document.getElementById("cfg-default-view").value   = c.print.defaultView;
    document.getElementById("cfg-show-source").checked  = c.print.showSourceReference;
    document.getElementById("cfg-allow-custom").checked = c.admin.allowCustomSchemas;
    document.getElementById("cfg-require-source").checked = c.admin.requireSourceReference;
    updateDirRowVisibility();
  }

  async function updateDirName() {
    const info = await Persistence.getDirectoryInfo();
    document.getElementById("cfg-dir-name").textContent = info ? info.name : "–";
  }

  function updateDirRowVisibility() {
    const mode = document.getElementById("cfg-storage-mode").value;
    document.getElementById("cfg-dir-row").style.display = mode === "file" ? "" : "none";
  }

  function saveSettings() {
    Config.set("storage.mode",              document.getElementById("cfg-storage-mode").value);
    Config.set("ui.language",               document.getElementById("cfg-language").value);
    Config.set("ui.clinicName",             document.getElementById("cfg-clinic-name").value);
    Config.set("print.defaultView",         document.getElementById("cfg-default-view").value);
    Config.set("print.showSourceReference", document.getElementById("cfg-show-source").checked);
    Config.set("admin.allowCustomSchemas",  document.getElementById("cfg-allow-custom").checked);
    Config.set("admin.requireSourceReference", document.getElementById("cfg-require-source").checked);

    const btn = document.getElementById("cfg-save");
    const original = btn.textContent;
    btn.textContent = "Gespeichert ✓";
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
  }

  function initSettings() {
    if (!Persistence.hasFileSystemAccess) {
      const fileOpt = document.querySelector('#cfg-storage-mode option[value="file"]');
      if (fileOpt) {
        fileOpt.disabled = true;
        fileOpt.textContent += " (nicht unterstützt)";
      }
      document.getElementById("cfg-dir-btn").disabled = true;
    }

    document.getElementById("cfg-storage-mode").addEventListener("change", updateDirRowVisibility);

    document.getElementById("cfg-dir-btn").addEventListener("click", async () => {
      await Persistence.selectDirectory();
      await updateDirName();
    });

    document.getElementById("cfg-dir-clear").addEventListener("click", async () => {
      await Persistence.clearDirectory();
      await updateDirName();
    });

    document.getElementById("cfg-save").addEventListener("click", saveSettings);

    document.getElementById("cfg-reset").addEventListener("click", () => {
      if (confirm("Alle Einstellungen auf Standardwerte zurücksetzen?")) {
        Config.reset();
        loadSettingsFromConfig();
      }
    });

    loadSettingsFromConfig();
    updateDirName();
  }

  /* ─── Init ───────────────────────────────────────────────────────────────── */

  function init() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    window.addEventListener("hashchange", () => activateTab(getActiveTabFromHash()));

    activateTab(getActiveTabFromHash());
    initSettings();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
