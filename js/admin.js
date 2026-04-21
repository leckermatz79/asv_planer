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

  /* ─── Chemo-Schemata Tab ────────────────────────────────────────────────── */

  let _chemoEditingId = null;
  let _chemoShowBuiltinNotice = false;

  function showChemoList() {
    document.getElementById("chemo-list-view").style.display = "";
    document.getElementById("chemo-editor-view").style.display = "none";
    renderChemoList();
  }

  function showChemoEditor() {
    document.getElementById("chemo-list-view").style.display = "none";
    document.getElementById("chemo-editor-view").style.display = "";
    updateEventsEmptyHint();
  }

  function renderChemoList() {
    const schemas = SchemaStore.getChemoSchemas();
    const tbody = document.getElementById("chemo-tbody");
    tbody.innerHTML = "";

    const entries = Object.entries(schemas).sort(([, a], [, b]) => {
      if (a._isCustom !== b._isCustom) return a._isCustom ? 1 : -1;
      return a.label.localeCompare(b.label, "de");
    });

    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">Keine Schemata vorhanden.</td></tr>`;
      return;
    }

    entries.forEach(([id, schema]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${schema.label}</td>
        <td>${schema.zyklus_tage} Tage</td>
        <td>${schema.anzahl_zyklen}</td>
        <td><span class="badge ${schema._isCustom ? "badge-custom" : "badge-builtin"}">${schema._isCustom ? "Custom" : "Built-in"}</span></td>
        <td class="action-cell"></td>
      `;
      const cell = tr.querySelector(".action-cell");

      const editBtn = makeBtn("Bearbeiten", "btn-table", () => openChemoEditor(id, "edit"));
      const dupBtn  = makeBtn("Duplizieren", "btn-table", () => openChemoEditor(id, "duplicate"));
      const delBtn  = makeBtn("Löschen", "btn-table btn-table-danger", () => deleteChemoSchema(id, schema.label));
      const expBtn  = makeBtn("Exportieren", "btn-table", () => exportSingleChemoSchema(id, schema));

      delBtn.disabled = !schema._isCustom;
      cell.append(editBtn, dupBtn, delBtn, expBtn);
      tbody.appendChild(tr);
    });
  }

  function makeBtn(text, className, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function openChemoEditor(id, mode) {
    _chemoEditingId = null;
    _chemoShowBuiltinNotice = false;

    const schema = id ? SchemaStore.getChemoSchemas()[id] : null;

    document.getElementById("ce-events-list").innerHTML = "";
    document.getElementById("ce-label").value         = "";
    document.getElementById("ce-zyklus-tage").value   = "";
    document.getElementById("ce-anzahl-zyklen").value = "";
    document.getElementById("ce-default-gcsf").checked = false;
    document.getElementById("ce-source").value        = "";
    document.getElementById("ce-version").value       = "";

    if (mode === "new") {
      document.getElementById("chemo-editor-title").textContent = "Neues Schema erstellen";
    } else {
      document.getElementById("ce-label").value         = schema.label || "";
      document.getElementById("ce-zyklus-tage").value   = schema.zyklus_tage || "";
      document.getElementById("ce-anzahl-zyklen").value = schema.anzahl_zyklen || "";
      document.getElementById("ce-default-gcsf").checked = !!schema.default_gcsf;
      document.getElementById("ce-source").value        = schema._source || "";
      document.getElementById("ce-version").value       = schema._version || "";
      (schema.events || []).forEach(ev => addEventRow(ev));

      if (mode === "edit") {
        document.getElementById("chemo-editor-title").textContent = "Schema bearbeiten";
        if (schema._isCustom) {
          _chemoEditingId = id;
        } else {
          _chemoShowBuiltinNotice = true;
        }
      } else {
        document.getElementById("chemo-editor-title").textContent = "Schema duplizieren";
        document.getElementById("ce-label").value = (schema.label || "") + " (Kopie)";
      }
    }

    document.getElementById("chemo-builtin-notice").style.display = _chemoShowBuiltinNotice ? "" : "none";
    showChemoEditor();
  }

  function createEventRow(event) {
    const type    = event.type || "therapy";
    const isLab   = type === "lab";
    const dayMode = isLab && event.workdays_before_next_cycle_start !== undefined ? "workdays" : "day";

    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
      <select class="ev-type">
        <option value="therapy">Therapie</option>
        <option value="lab">Labor</option>
      </select>
      <div class="ev-therapy-fields">
        <input type="text" class="ev-drug" placeholder="Medikament">
        <input type="text" class="ev-short" placeholder="Kürzel">
        <label class="ev-inline-label">Tag <input type="number" class="ev-day" min="1"></label>
      </div>
      <div class="ev-lab-fields">
        <select class="ev-day-mode">
          <option value="day">Fester Tag</option>
          <option value="workdays">Vor nächstem Zyklus</option>
        </select>
        <label class="ev-inline-label ev-lab-day-wrap">Tag <input type="number" class="ev-lab-day" min="1"></label>
        <label class="ev-inline-label ev-workdays-wrap">Arbeitstage <input type="number" class="ev-workdays" min="1"></label>
        <label class="ev-inline-label"><input type="checkbox" class="ev-fasting"> Nüchtern</label>
      </div>
      <div class="event-row-actions">
        <button type="button" class="btn-icon btn-icon-danger ev-delete" title="Löschen">✕</button>
      </div>
    `;

    // Werte setzen (sicher via DOM, nicht via innerHTML)
    row.querySelector(".ev-type").value = type;
    if (!isLab) {
      row.querySelector(".ev-drug").value  = event.drug  || "";
      row.querySelector(".ev-short").value = event.short || "";
      if (event.day != null) row.querySelector(".ev-day").value = event.day;
    } else {
      row.querySelector(".ev-day-mode").value = dayMode;
      if (dayMode === "day"      && event.day != null)                          row.querySelector(".ev-lab-day").value = event.day;
      if (dayMode === "workdays" && event.workdays_before_next_cycle_start != null) row.querySelector(".ev-workdays").value = event.workdays_before_next_cycle_start;
      if (event.fasting) row.querySelector(".ev-fasting").checked = true;
    }

    // Sichtbarkeit
    row.querySelector(".ev-therapy-fields").style.display = isLab   ? "none" : "flex";
    row.querySelector(".ev-lab-fields").style.display     = isLab   ? "flex" : "none";
    row.querySelector(".ev-lab-day-wrap").style.display   = dayMode === "workdays" ? "none" : "";
    row.querySelector(".ev-workdays-wrap").style.display  = dayMode === "workdays" ? ""     : "none";

    // Typ-Wechsel
    row.querySelector(".ev-type").addEventListener("change", e => {
      const lab = e.target.value === "lab";
      row.querySelector(".ev-therapy-fields").style.display = lab ? "none" : "flex";
      row.querySelector(".ev-lab-fields").style.display     = lab ? "flex" : "none";
    });

    // Tagmodus-Wechsel
    row.querySelector(".ev-day-mode").addEventListener("change", e => {
      const wdays = e.target.value === "workdays";
      row.querySelector(".ev-lab-day-wrap").style.display  = wdays ? "none" : "";
      row.querySelector(".ev-workdays-wrap").style.display = wdays ? "" : "none";
    });

    // Löschen
    row.querySelector(".ev-delete").addEventListener("click", () => {
      row.remove();
      updateEventsEmptyHint();
    });

    return row;
  }

  function addEventRow(event) {
    document.getElementById("ce-events-list").appendChild(createEventRow(event));
    updateEventsEmptyHint();
  }

  function updateEventsEmptyHint() {
    const empty = document.getElementById("ce-events-list").children.length === 0;
    document.getElementById("ce-events-empty").style.display = empty ? "" : "none";
  }

  function readEventRow(row) {
    const type = row.querySelector(".ev-type").value;
    if (type === "therapy") {
      const ev  = { type: "therapy", drug: row.querySelector(".ev-drug").value.trim(), short: row.querySelector(".ev-short").value.trim() };
      const day = parseInt(row.querySelector(".ev-day").value, 10);
      if (!isNaN(day)) ev.day = day;
      return ev;
    } else {
      const ev      = { type: "lab", label: "Labor" };
      const dayMode = row.querySelector(".ev-day-mode").value;
      if (dayMode === "day") {
        const day = parseInt(row.querySelector(".ev-lab-day").value, 10);
        if (!isNaN(day)) ev.day = day;
      } else {
        const wdays = parseInt(row.querySelector(".ev-workdays").value, 10);
        if (!isNaN(wdays)) ev.workdays_before_next_cycle_start = wdays;
      }
      if (row.querySelector(".ev-fasting").checked) ev.fasting = true;
      return ev;
    }
  }

  function saveChemoEditor() {
    const label        = document.getElementById("ce-label").value.trim();
    const zyklus_tage  = parseInt(document.getElementById("ce-zyklus-tage").value, 10);
    const anzahl_zyklen = parseInt(document.getElementById("ce-anzahl-zyklen").value, 10);

    if (!label || isNaN(zyklus_tage) || isNaN(anzahl_zyklen)) {
      alert("Bitte Name, Zykluslänge und Anzahl Zyklen ausfüllen.");
      return;
    }

    const events = Array.from(document.getElementById("ce-events-list").querySelectorAll(".event-row"))
      .map(readEventRow)
      .filter(ev => ev.type === "lab" || ev.drug);

    const schema = { label, zyklus_tage, anzahl_zyklen, events };
    if (document.getElementById("ce-default-gcsf").checked) schema.default_gcsf = true;
    const source  = document.getElementById("ce-source").value.trim();
    const version = document.getElementById("ce-version").value.trim();
    if (source)  schema._source  = source;
    if (version) schema._version = version;
    if (_chemoEditingId) schema._id = _chemoEditingId;

    SchemaStore.saveCustomSchema("chemo", schema);
    showChemoList();
  }

  function deleteChemoSchema(id, label) {
    if (!confirm(`Schema „${label}" wirklich löschen?`)) return;
    SchemaStore.deleteCustomSchema("chemo", id);
    renderChemoList();
  }

  function exportSingleChemoSchema(id, schema) {
    const { _isCustom, ...clean } = schema;
    const filename = (schema.label || id).replace(/[^\wäöüÄÖÜß]/g, "_").replace(/_+/g, "_") + ".json";
    Persistence.exportToFile(filename, { chemo: { [id]: clean } });
  }

  function initChemoTab() {
    document.getElementById("chemo-new-btn").addEventListener("click", () => openChemoEditor(null, "new"));
    document.getElementById("ce-add-event").addEventListener("click", () => addEventRow({}));
    document.getElementById("ce-save").addEventListener("click", saveChemoEditor);
    document.getElementById("ce-cancel").addEventListener("click", showChemoList);
    renderChemoList();
  }

  /* ─── Init ───────────────────────────────────────────────────────────────── */

  function init() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    window.addEventListener("hashchange", () => activateTab(getActiveTabFromHash()));

    activateTab(getActiveTabFromHash());
    initSettings();
    initChemoTab();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
