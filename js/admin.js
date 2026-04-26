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

  /* ─── Shared Schema-Tab Helper ──────────────────────────────────────────── */

  function renderGenericSchemaList(tbodyId, schemas, getLabel, getExtraCells, handlers) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";

    const entries = Object.entries(schemas).sort(([idA, a], [idB, b]) => {
      if (a._isCustom !== b._isCustom) return a._isCustom ? 1 : -1;
      return getLabel(idA, a).localeCompare(getLabel(idB, b), "de");
    });

    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:2rem">Keine Schemata vorhanden.</td></tr>`;
      return;
    }

    entries.forEach(([id, schema]) => {
      const tr = document.createElement("tr");
      const extraCells = getExtraCells(id, schema).map(c => `<td>${c}</td>`).join("");
      tr.innerHTML = `
        <td>${getLabel(id, schema)}</td>
        ${extraCells}
        <td><span class="badge ${schema._isCustom ? "badge-custom" : "badge-builtin"}">${schema._isCustom ? "Custom" : "Built-in"}</span></td>
        <td class="action-cell"></td>
      `;
      const cell = tr.querySelector(".action-cell");
      const editBtn = makeBtn("Bearbeiten",  "btn-table",                  () => handlers.edit(id));
      const dupBtn  = makeBtn("Duplizieren", "btn-table",                  () => handlers.duplicate(id));
      const delBtn  = makeBtn("Löschen",     "btn-table btn-table-danger", () => handlers.delete(id, getLabel(id, schema)));
      const expBtn  = makeBtn("Exportieren", "btn-table",                  () => handlers.export(id, schema));
      delBtn.disabled = !schema._isCustom;
      cell.append(editBtn, dupBtn, delBtn, expBtn);
      tbody.appendChild(tr);
    });
  }

  function exportSingleSchema(type, id, schema) {
    const { _isCustom, ...clean } = schema;
    const label    = schema.label || id;
    const filename = label.replace(/[^\wäöüÄÖÜß]/g, "_").replace(/_+/g, "_") + ".json";
    Persistence.exportToFile(filename, { [type]: { [id]: clean } });
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

  /* ─── Support-Schemata Tab ──────────────────────────────────────────────── */

  let _supportEditingId = null;
  let _supportShowBuiltinNotice = false;

  function showSupportList() {
    document.getElementById("support-list-view").style.display = "";
    document.getElementById("support-editor-view").style.display = "none";
    renderSupportList();
  }

  function showSupportEditor() {
    document.getElementById("support-list-view").style.display = "none";
    document.getElementById("support-editor-view").style.display = "";
    updateSupportEmptyHint();
  }

  function renderSupportList() {
    renderGenericSchemaList(
      "support-tbody",
      SchemaStore.getSupportSchemas(),
      (id, s)  => s.label || id,
      (id, s)  => [s.version || "–", (s.days || []).length + " Tage"],
      {
        edit:      id           => openSupportEditor(id, "edit"),
        duplicate: id           => openSupportEditor(id, "duplicate"),
        delete:    (id, label)  => deleteSupportSchema(id, label),
        export:    (id, schema) => exportSingleSchema("support", id, schema),
      }
    );
  }

  function openSupportEditor(id, mode) {
    _supportEditingId        = null;
    _supportShowBuiltinNotice = false;

    const schema = id ? SchemaStore.getSupportSchemas()[id] : null;

    document.getElementById("se-days-list").innerHTML = "";
    document.getElementById("se-label").value         = "";
    document.getElementById("se-version").value       = "";

    if (mode === "new") {
      document.getElementById("support-editor-title").textContent = "Neues Schema erstellen";
    } else {
      document.getElementById("se-label").value   = schema.label   || "";
      document.getElementById("se-version").value = schema.version || "";
      (schema.days || []).forEach(dayObj => addDayBlock(dayObj));

      if (mode === "edit") {
        document.getElementById("support-editor-title").textContent = "Schema bearbeiten";
        if (schema._isCustom) { _supportEditingId = id; }
        else                  { _supportShowBuiltinNotice = true; }
      } else {
        document.getElementById("support-editor-title").textContent = "Schema duplizieren";
        document.getElementById("se-label").value = (schema.label || "") + " (Kopie)";
      }
    }

    document.getElementById("support-builtin-notice").style.display = _supportShowBuiltinNotice ? "" : "none";
    showSupportEditor();
  }

  function createMedRow(med) {
    const row = document.createElement("div");
    row.className = "med-row";
    row.innerHTML = `
      <input type="text" class="med-name"     placeholder="Medikament">
      <input type="text" class="med-dosage"   placeholder="Dosierung (z.B. 1-0-0)">
      <select class="med-note-key">
        <option value="">–</option>
        <option value="morning">Morgens</option>
        <option value="evening">Abends</option>
      </select>
      <button type="button" class="btn-icon btn-icon-danger med-delete" title="Löschen">✕</button>
    `;
    row.querySelector(".med-name").value     = med.name    || "";
    row.querySelector(".med-dosage").value   = med.dosage  || "";
    row.querySelector(".med-note-key").value = med.noteKey || "";
    row.querySelector(".med-delete").addEventListener("click", () => row.remove());
    return row;
  }

  function createDayBlock(dayObj) {
    const block = document.createElement("div");
    block.className = "day-block";
    block.innerHTML = `
      <div class="day-block-header">
        <label class="ev-inline-label">Tag <input type="number" class="sb-day" min="1"></label>
        <button type="button" class="btn-secondary sb-add-med">+ Medikament</button>
        <button type="button" class="btn-icon btn-icon-danger sb-delete-day" title="Tag löschen">✕</button>
      </div>
      <div class="sb-meds-list"></div>
    `;

    if (dayObj.day != null) block.querySelector(".sb-day").value = dayObj.day;

    const medsList = block.querySelector(".sb-meds-list");
    (dayObj.meds || []).forEach(med => medsList.appendChild(createMedRow(med)));

    block.querySelector(".sb-add-med").addEventListener("click", () => medsList.appendChild(createMedRow({})));
    block.querySelector(".sb-delete-day").addEventListener("click", () => {
      block.remove();
      updateSupportEmptyHint();
    });

    return block;
  }

  function addDayBlock(dayObj) {
    document.getElementById("se-days-list").appendChild(createDayBlock(dayObj));
    updateSupportEmptyHint();
  }

  function updateSupportEmptyHint() {
    const empty = document.getElementById("se-days-list").children.length === 0;
    document.getElementById("se-days-empty").style.display = empty ? "" : "none";
  }

  function readDayBlock(block) {
    const day  = parseInt(block.querySelector(".sb-day").value, 10);
    const meds = Array.from(block.querySelectorAll(".med-row")).map(row => {
      const m = {
        name:   row.querySelector(".med-name").value.trim(),
        dosage: row.querySelector(".med-dosage").value.trim(),
      };
      const noteKey = row.querySelector(".med-note-key").value;
      if (noteKey) m.noteKey = noteKey;
      return m;
    }).filter(m => m.name);
    return { day: isNaN(day) ? null : day, meds };
  }

  function saveSupportEditor() {
    const label   = document.getElementById("se-label").value.trim();
    const version = document.getElementById("se-version").value.trim();

    if (!label) { alert("Bitte einen Namen angeben."); return; }

    const days = Array.from(document.getElementById("se-days-list").querySelectorAll(".day-block"))
      .map(readDayBlock)
      .filter(d => d.day != null);

    const schema = { label, days };
    if (version) schema.version = version;
    if (_supportEditingId) schema._id = _supportEditingId;

    SchemaStore.saveCustomSchema("support", schema);
    showSupportList();
  }

  function deleteSupportSchema(id, label) {
    if (!confirm(`Schema „${label}" wirklich löschen?`)) return;
    SchemaStore.deleteCustomSchema("support", id);
    renderSupportList();
  }

  function initSupportTab() {
    document.getElementById("support-new-btn").addEventListener("click", () => openSupportEditor(null, "new"));
    document.getElementById("se-add-day").addEventListener("click",     () => addDayBlock({}));
    document.getElementById("se-save").addEventListener("click",        saveSupportEditor);
    document.getElementById("se-cancel").addEventListener("click",      showSupportList);
    renderSupportList();
  }

  /* ─── G-CSF-Schemata Tab ─────────────────────────────────────────────────── */

  let _gcsfEditingId = null;
  let _gcsfShowBuiltinNotice = false;

  function showGcsfList() {
    document.getElementById("gcsf-list-view").style.display = "";
    document.getElementById("gcsf-editor-view").style.display = "none";
    renderGcsfList();
  }

  function showGcsfEditor() {
    document.getElementById("gcsf-list-view").style.display = "none";
    document.getElementById("gcsf-editor-view").style.display = "";
  }

  function gcsfDaysDisplay(schema) {
    if (schema.type === "multiple") return (schema.days || []).map(d => "d" + d).join(", ");
    return schema.defaultDay != null ? "d" + schema.defaultDay : "–";
  }

  function renderGcsfList() {
    renderGenericSchemaList(
      "gcsf-tbody",
      SchemaStore.getGcsfSchemas(),
      (id)     => id,
      (id, s)  => [s.type === "multiple" ? "Mehrfachdosis" : "Einzeldosis", gcsfDaysDisplay(s)],
      {
        edit:      id           => openGcsfEditor(id, "edit"),
        duplicate: id           => openGcsfEditor(id, "duplicate"),
        delete:    (id, label)  => deleteGcsfSchema(id, label),
        export:    (id, schema) => exportSingleSchema("gcsf", id, schema),
      }
    );
  }

  function updateGcsfTypeFields() {
    const type = document.getElementById("ge-type").value;
    document.getElementById("ge-single-row").style.display   = type === "single"   ? "" : "none";
    document.getElementById("ge-multiple-row").style.display = type === "multiple" ? "" : "none";
  }

  function openGcsfEditor(id, mode) {
    _gcsfEditingId        = null;
    _gcsfShowBuiltinNotice = false;

    const schema = id ? SchemaStore.getGcsfSchemas()[id] : null;

    document.getElementById("ge-name").value        = "";
    document.getElementById("ge-type").value        = "single";
    document.getElementById("ge-default-day").value = "";
    document.getElementById("ge-days").value        = "";

    if (mode === "new") {
      document.getElementById("gcsf-editor-title").textContent = "Neues Schema erstellen";
    } else {
      document.getElementById("ge-name").value = mode === "duplicate" ? id + " (Kopie)" : id;
      document.getElementById("ge-type").value = schema.type || "single";

      if (schema.type === "multiple") {
        document.getElementById("ge-days").value = (schema.days || []).join(", ");
      } else {
        document.getElementById("ge-default-day").value = schema.defaultDay ?? "";
      }

      if (mode === "edit") {
        document.getElementById("gcsf-editor-title").textContent = "Schema bearbeiten";
        if (schema._isCustom) { _gcsfEditingId = id; }
        else                  { _gcsfShowBuiltinNotice = true; }
      } else {
        document.getElementById("gcsf-editor-title").textContent = "Schema duplizieren";
      }
    }

    document.getElementById("gcsf-builtin-notice").style.display = _gcsfShowBuiltinNotice ? "" : "none";
    updateGcsfTypeFields();
    showGcsfEditor();
  }

  function saveGcsfEditor() {
    const name = document.getElementById("ge-name").value.trim();
    const type = document.getElementById("ge-type").value;

    if (!name) { alert("Bitte einen Namen angeben."); return; }

    const schema = { type };

    if (type === "single") {
      const day = parseInt(document.getElementById("ge-default-day").value, 10);
      if (isNaN(day)) { alert("Bitte einen Applikationstag angeben."); return; }
      schema.defaultDay = day;
    } else {
      const days = document.getElementById("ge-days").value
        .split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (days.length === 0) { alert("Bitte mindestens einen Applikationstag angeben."); return; }
      schema.days = days;
    }

    // Für G-CSF ist der Medikamentenname der Key – bei Umbenennung alten Eintrag löschen
    if (_gcsfEditingId && name !== _gcsfEditingId) {
      SchemaStore.deleteCustomSchema("gcsf", _gcsfEditingId);
    }
    schema._id = name;

    SchemaStore.saveCustomSchema("gcsf", schema);
    showGcsfList();
  }

  function deleteGcsfSchema(id, label) {
    if (!confirm(`Schema „${label}" wirklich löschen?`)) return;
    SchemaStore.deleteCustomSchema("gcsf", id);
    renderGcsfList();
  }

  function initGcsfTab() {
    document.getElementById("gcsf-new-btn").addEventListener("click", () => openGcsfEditor(null, "new"));
    document.getElementById("ge-type").addEventListener("change",     updateGcsfTypeFields);
    document.getElementById("ge-save").addEventListener("click",      saveGcsfEditor);
    document.getElementById("ge-cancel").addEventListener("click",    showGcsfList);
    renderGcsfList();
  }

  /* ─── Import / Export Tab ───────────────────────────────────────────────── */

  let _importData = null;

  function analyzeImportData(data) {
    let newCount = 0, conflictCount = 0;
    const existingCustom = SchemaStore.exportAllCustom();
    for (const type of ["chemo", "support", "gcsf"]) {
      if (!data[type] || typeof data[type] !== "object") continue;
      const existing = existingCustom[type] || {};
      for (const id of Object.keys(data[type])) {
        if (existing[id]) conflictCount++;
        else newCount++;
      }
    }
    return { newCount, conflictCount };
  }

  function showImportPreview(newCount, conflictCount) {
    const summary = document.getElementById("ie-preview-summary");
    let html = "";
    if (newCount > 0)      html += `<div class="ie-summary-row ie-summary-ok">✓ ${newCount} neue${newCount === 1 ? "s Schema" : " Schemata"} gefunden</div>`;
    if (conflictCount > 0) html += `<div class="ie-summary-row ie-summary-warn">⚠ ${conflictCount} Konflikt${conflictCount === 1 ? "" : "e"} – Schema-ID${conflictCount === 1 ? "" : "s"} bereits vorhanden</div>`;
    if (newCount === 0 && conflictCount === 0) html += `<div class="ie-summary-row">Keine importierbaren Schemata in dieser Datei.</div>`;
    summary.innerHTML = html;

    document.getElementById("ie-conflict-opts").style.display = conflictCount > 0 ? "" : "none";
    document.querySelector('input[name="ie-conflict"][value="skip"]').checked = true;

    const startBtn = document.getElementById("ie-import-start");
    startBtn.style.display = "";
    startBtn.disabled = (newCount === 0 && conflictCount === 0);

    document.getElementById("ie-import-preview").style.display = "";
  }

  async function handleImportFileChange(file) {
    _importData = null;
    document.getElementById("ie-import-preview").style.display = "none";
    if (!file) return;

    let data;
    try {
      data = await Persistence.importFromFile(file);
    } catch (e) {
      alert("Fehler beim Lesen der Datei: " + e.message);
      return;
    }

    const hasAny = ["chemo", "support", "gcsf"].some(
      t => data[t] && typeof data[t] === "object" && Object.keys(data[t]).length > 0
    );
    if (!hasAny) {
      alert("Die Datei enthält keine importierbaren Schemata.");
      return;
    }

    _importData = data;
    const { newCount, conflictCount } = analyzeImportData(data);
    showImportPreview(newCount, conflictCount);
  }

  function executeImport() {
    if (!_importData) return;

    const strategy = document.querySelector('input[name="ie-conflict"]:checked').value;
    const existingCustom = SchemaStore.exportAllCustom();
    let imported = 0;
    let suffix = Date.now();

    for (const type of ["chemo", "support", "gcsf"]) {
      if (!_importData[type] || typeof _importData[type] !== "object") continue;
      const existing = existingCustom[type] || {};

      for (const [id, schema] of Object.entries(_importData[type])) {
        const isConflict = !!existing[id];
        if (isConflict && strategy === "skip") continue;

        let targetId = id;
        if (isConflict && strategy === "rename") targetId = id + "_import_" + suffix++;

        SchemaStore.saveCustomSchema(type, { ...schema, _id: targetId });
        imported++;
      }
    }

    const summary = document.getElementById("ie-preview-summary");
    summary.innerHTML = `<div class="ie-summary-row ie-summary-ok">✓ ${imported} ${imported === 1 ? "Schema" : "Schemata"} erfolgreich importiert.</div>`;
    document.getElementById("ie-conflict-opts").style.display = "none";
    document.getElementById("ie-import-start").style.display = "none";

    document.getElementById("ie-file-input").value = "";
    document.getElementById("ie-file-name").textContent = "Keine Datei ausgewählt";
    _importData = null;

    renderChemoList();
    renderSupportList();
    renderGcsfList();
  }

  function handleExport() {
    const data = SchemaStore.exportAllCustom();
    const total = Object.values(data).reduce((sum, s) => sum + Object.keys(s).length, 0);
    if (total === 0) {
      document.getElementById("ie-export-empty").style.display = "";
      return;
    }
    document.getElementById("ie-export-empty").style.display = "none";
    const filename = "schemata_custom_" + new Date().toISOString().slice(0, 10) + ".json";
    Persistence.exportToFile(filename, data);
  }

  function handleFactoryReset() {
    const data = SchemaStore.exportAllCustom();
    const total = Object.values(data).reduce((sum, s) => sum + Object.keys(s).length, 0);
    if (total === 0) { alert("Es sind keine Custom-Schemata vorhanden."); return; }
    if (!confirm(`Wirklich alle ${total} Custom-${total === 1 ? "Schema" : "Schemata"} unwiderruflich löschen?`)) return;

    SchemaStore.resetAllCustom();
    renderChemoList();
    renderSupportList();
    renderGcsfList();

    const btn = document.getElementById("ie-reset-btn");
    const orig = btn.textContent;
    btn.textContent = "Gelöscht ✓";
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2000);
  }

  function initImportExportTab() {
    document.getElementById("ie-export-btn").addEventListener("click", handleExport);

    document.getElementById("ie-file-input").addEventListener("change", e => {
      const file = e.target.files[0];
      document.getElementById("ie-file-name").textContent = file ? file.name : "Keine Datei ausgewählt";
      handleImportFileChange(file || null);
    });

    document.getElementById("ie-import-start").addEventListener("click", executeImport);
    document.getElementById("ie-reset-btn").addEventListener("click", handleFactoryReset);
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
    initSupportTab();
    initGcsfTab();
    initImportExportTab();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
