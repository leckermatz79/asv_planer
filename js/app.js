/* /js/app.js
/* =========================================
   THERAPY PLANNER – Option B (Restored Features)
   - i18n labels in dynamic HTML
   - localized dates (birth/start/created)
   - legend restored
   - support dropdown restored
   - labs + fasting in graphic + table
   - follow-up restored (+ separator row)
   - G-CSF icon styling restored
========================================= */

(() => {
  "use strict";

  /* =========================
     STATE
  ========================= */

  const AppState = {
    schemas: {},
    lastRender: null // { schemaKey, schema, followKey, followSchema, startDate, ... }
  };

  const DOM = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    loadSchemas();
    cacheDom();
    initDrugColors();
    initSupportSchemas();
    initGcsfSchemas();
    populateSchemaDropdowns();
    populateSupportDropdowns();
    registerEventListeners();
    updateUIVisibility();
  }

  function loadSchemas() {
    // Schemas are now provided via external file (chemoSchemas.js)
    AppState.schemas = window.CHEMO_SCHEMAS || {};
  }

  function cacheDom() {
    const ids = [
      "therapyForm",
      "schemaInput",
      "schemaList",
      "languageSelect",

      "supportSelect",
      "supportFollowUpSelect",
      "supportFollowUpWrapper",
      "printSupportBtn",

      "hasFollowUp",
      "followUpSelect",
      "followUpWrapper",

      "gcsfEnabled",
      "gcsfRow",
      "gcsfSelect",
      "gcsfDay",
      "gcsfDayWrapper",

      "gcsfEnabledFollow",
      "gcsfRowFollow",
      "gcsfSelectFollow",
      "gcsfDayFollow",
      "gcsfDayWrapperFollow",
      "gcsfFollowUpToggle",

      "plan",
      "graphic",
      "table",
      "patient",

      "vorname",
      "nachname",
      "geburt",
      "startdatum",

      "supportGraphic",
      "supportPlan"
    ];
    ids.forEach((id) => (DOM[id] = document.getElementById(id)));
  }

  /* =========================
     i18n-safe helpers
  ========================= */

  function getLocale() {
    const lang = localStorage.getItem("therapyplanner_lang") || "de";

    if (window.localeMap && window.localeMap[lang]) {
      return window.localeMap[lang];
    }

    return lang;
  }

  function fmtDate(date) {
    return date.toLocaleDateString(getLocale());
  }

  function parseDateInput(value) {
    if (!value) return null;
    const d = new Date(value + "T12:00:00");
    return isNaN(d) ? null : d;
  }

  function safeT(key, ...params) {
    // t() comes from i18n.js
    if (typeof t === "function") return t(key, ...params);
    return key;
  }

  function isWeekend(date) {
    const dow = date.getDay();
    return dow === 0 || dow === 6;
  }

  /* =========================
     DRUG COLORS
  ========================= */

  let drugColors = {};

  function initDrugColors() {
    drugColors = {
      "Paclitaxel": "#059669",
      "Nab-Paclitaxel": "#047857",
      "Docetaxel": "#0d9488",

      "Cyclophosphamid": "#2563eb",
      "Epirubicin": "#b91c1c",

      "Carboplatin": "#f59e0b",
      "Cisplatin": "#d97706",

      "Trastuzumab": "#7c3aed",
      "Pertuzumab": "#a21caf",
      "T-DM1": "#be185d",
      "Trastuzumab-Deruxtecan": "#9d174d",

      "Pembrolizumab": "#8b5cf6",
      "Atezolizumab": "#9333ea",

      "Mirvetuximab Soravtansin": "#0891b2",
      "Sacituzumab Govitecan": "#0ea5e9",

      "Eribulin": "#4b5563",
      "Trabectedin": "#374151",
      "Methotrexat": "#65a30d"
    };
  }

  function getDrugColor(drug) {
    return drugColors[drug] || "#6b7280";
  }

  /* =========================
     SUPPORT SCHEMAS (Dropdown)
     (externalized to supportSchemas.js)
  ========================= */

  let supportSchemas = {};
  let gcsfSchemas = {};

  function initSupportSchemas() {
    // Support schemas are now provided via external file (supportSchemas.js)
    supportSchemas = window.SUPPORT_SCHEMAS || {};
  }

  function initGcsfSchemas() {
    gcsfSchemas = window.GCSF_SCHEMAS || {};
  }
  // =========================
  // SUPPORT PLAN RENDERER
  // =========================
  function renderSupportPlan(r) {
    if (!DOM.supportGraphic) return;

    DOM.supportGraphic.innerHTML = "";

    const mainKey = DOM.supportSelect?.value || "---";
    const followKey = DOM.supportFollowUpSelect?.value || "---";

    const mainSupport = (mainKey !== "---") ? supportSchemas[mainKey] : null;
    const followSupport = (followKey !== "---") ? supportSchemas[followKey] : null;

    if (!mainSupport && !followSupport && !r.gcsfMain.config && !r.gcsfFollow.config) {
      return;
    }

    const container = document.createElement("div");

    r.allCycles.forEach((cycle, idx) => {

      const isFollow = r.hasFollowUp && idx >= r.cyclesMain.length;

      const currentSupport = isFollow ? followSupport : mainSupport;
      const currentGcsf = isFollow ? r.gcsfFollow.config : r.gcsfMain.config;
      const label = isFollow && r.followSchema
        ? r.followSchema.label
        : r.schema.label;

      const hasSupportDays = currentSupport && currentSupport.days?.length > 0;
      const hasGcsf = !!currentGcsf;

      if (!hasSupportDays && !hasGcsf) return;

      const block = document.createElement("div");
      block.classList.add("support-cycle");
      block.style.marginTop = "2rem";

      block.innerHTML = `<h2>${safeT("cycle")} ${cycle.index} – ${label}</h2>`;

      const totalDays = cycle.days.length;
      const weeksToRender = new Set();

      // 🔹 Wochen mit Support ermitteln
      if (currentSupport) {
        currentSupport.days.forEach(supportDay => {
          const weekIndex = Math.floor((supportDay.day - 1) / 7);
          weeksToRender.add(weekIndex);
        });
      }

      // 🔹 Wochen mit G-CSF ermitteln
      if (currentGcsf) {
        const gcsfDays = currentGcsf.multipleDays || [currentGcsf.day];
        gcsfDays.forEach(d => {
          const weekIndex = Math.floor((d - 1) / 7);
          weeksToRender.add(weekIndex);
        });
      }

      // 🔹 Sortieren
      const sortedWeeks = Array.from(weeksToRender).sort((a,b)=>a-b);

      sortedWeeks.forEach(w => {

        const weekGrid = document.createElement("div");
        weekGrid.classList.add("support-week");
        weekGrid.style.display = "grid";
        weekGrid.style.gridTemplateColumns = "repeat(7,1fr)";
        weekGrid.style.gap = "10px";
        weekGrid.style.marginBottom = "1.5rem";

        for (let i = 0; i < 7; i++) {

          const dayIndex = w * 7 + i;
          if (dayIndex >= totalDays) break;

          const dayObj = cycle.days[dayIndex];

          const dayBox = document.createElement("div");
          dayBox.style.border = "1px solid #e5e7eb";
          dayBox.style.borderRadius = "12px";
          dayBox.style.padding = "10px";
          dayBox.style.background = "#f9fafb";

          dayBox.innerHTML = `
            <div style="font-weight:700;margin-bottom:6px;">
              ${fmtDate(dayObj.date)}<br>
              <span style="font-size:0.75rem;color:#6b7280;">d${dayObj.day}</span>
            </div>
          `;

          // Support
          if (currentSupport) {
            const match = currentSupport.days.find(d => d.day === dayObj.day);
            if (match) {
              match.meds.forEach(med => {
                dayBox.innerHTML += `
                  <div style="margin-bottom:6px;padding:6px;background:white;border-radius:8px;font-size:0.8rem;">
                    <strong>${med.name}</strong><br>
                    ${med.dosage}${med.noteKey ? ' – ' + safeT(med.noteKey) : ''}
                  </div>
                `;
              });
            }
          }

          // G-CSF
          if (currentGcsf) {
            const gcsfDays = currentGcsf.multipleDays || [currentGcsf.day];
            if (gcsfDays.includes(dayObj.day)) {
              dayBox.innerHTML += `
                <div style="margin-bottom:6px;padding:6px;background:#e0f2fe;border-radius:8px;font-size:0.8rem;">
                  <strong>${currentGcsf.drug}</strong><br>${safeT("injection")}
                </div>
              `;
            }
          }

          weekGrid.appendChild(dayBox);
        }

        block.appendChild(weekGrid);
      });
      container.appendChild(block);
    });

    container.innerHTML += `
      <div style="margin-top:2rem;padding:1rem;border-top:2px solid #333;font-size:0.9rem;">
        <strong>${safeT("nausea")}</strong><br>
        ${safeT("ondansetronHint")}
      </div>
    `;

    DOM.supportGraphic.appendChild(container);
  }

  /* =========================
     DROPDOWNS
  ========================= */

  function populateSchemaDropdowns() {
    // datalist for schemaInput
    Object.entries(AppState.schemas).forEach(([key, schema]) => {
      const opt = document.createElement("option");
      opt.value = schema.label;
      opt.dataset.key = key;
      DOM.schemaList.appendChild(opt);
    });

    // followUp select
    if (DOM.followUpSelect) {
      DOM.followUpSelect.innerHTML = "";
      Object.entries(AppState.schemas).forEach(([key, schema]) => {
        const followOpt = document.createElement("option");
        followOpt.value = key;
        followOpt.textContent = schema.label;
        DOM.followUpSelect.appendChild(followOpt);
      });
    }
  }

  function populateSupportDropdowns() {
    if (!DOM.supportSelect) return;

    DOM.supportSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "---";
    placeholder.textContent = "---";
    DOM.supportSelect.appendChild(placeholder);

    Object.entries(supportSchemas).forEach(([key, s]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = s.label;
      DOM.supportSelect.appendChild(opt);
    });

    if (DOM.supportFollowUpSelect) {
      DOM.supportFollowUpSelect.innerHTML = "";
      const ph2 = document.createElement("option");
      ph2.value = "---";
      ph2.textContent = "---";
      DOM.supportFollowUpSelect.appendChild(ph2);

      Object.entries(supportSchemas).forEach(([key, s]) => {
        const opt2 = document.createElement("option");
        opt2.value = key;
        opt2.textContent = s.label;
        DOM.supportFollowUpSelect.appendChild(opt2);
      });
    }
  }

  /* =========================
     EVENTS / UI VISIBILITY
  ========================= */

  function registerEventListeners() {
    DOM.hasFollowUp?.addEventListener("change", () => {
      updateUIVisibility();
      rerenderIfNeeded();
    });

    DOM.gcsfEnabled?.addEventListener("change", () => {
      updateUIVisibility();
      rerenderIfNeeded();
    });

    DOM.gcsfSelect?.addEventListener("change", () => {
      updateGcsfVisibility();
      rerenderIfNeeded();
    });

    DOM.gcsfEnabledFollow?.addEventListener("change", () => {
      updateUIVisibility();
      rerenderIfNeeded();
    });

    DOM.gcsfSelectFollow?.addEventListener("change", () => {
      updateGcsfFollowVisibility();
      rerenderIfNeeded();
    });

    DOM.therapyForm?.addEventListener("submit", submitHandler);

    // When language changes: i18n.js updates static texts, we must re-render dynamic output
    DOM.languageSelect?.addEventListener("change", () => {
      // i18n.js already calls setLanguage via its own listener
      // we just rerender (if something is already displayed)
      setTimeout(rerenderIfNeeded, 0);
    });
  }

  function updateUIVisibility() {
    updateFollowUpVisibility();
    updateGcsfVisibility();
    updateGcsfFollowVisibility();
  }

  function updateFollowUpVisibility() {
    if (!DOM.hasFollowUp || !DOM.followUpWrapper) return;

    const show = DOM.hasFollowUp.checked;
    DOM.followUpWrapper.style.display = show ? "block" : "none";

    if (DOM.supportFollowUpWrapper) DOM.supportFollowUpWrapper.style.display = show ? "block" : "none";
    if (DOM.gcsfFollowUpToggle) DOM.gcsfFollowUpToggle.style.display = show ? "block" : "none";

    if (!show && DOM.gcsfEnabledFollow) {
      DOM.gcsfEnabledFollow.checked = false;
    }
  }

  function updateGcsfVisibility() {
    if (!DOM.gcsfEnabled || !DOM.gcsfRow) return;

    const show = DOM.gcsfEnabled.checked;
    DOM.gcsfRow.style.display = show ? "grid" : "none";

    // hide day selector for Filgrastim (multiple days)
    const isFilgrastim = DOM.gcsfSelect?.value === "Filgrastim";
    if (DOM.gcsfDayWrapper) {
      DOM.gcsfDayWrapper.style.display = show && !isFilgrastim ? "block" : "none";
    }
  }

  function updateGcsfFollowVisibility() {
    if (!DOM.gcsfRowFollow) return;

    const show = !!(DOM.hasFollowUp?.checked && DOM.gcsfEnabledFollow?.checked);
    DOM.gcsfRowFollow.style.display = show ? "grid" : "none";

    const isFilgrastim = DOM.gcsfSelectFollow?.value === "Filgrastim";
    if (DOM.gcsfDayWrapperFollow) {
      DOM.gcsfDayWrapperFollow.style.display = show && !isFilgrastim ? "block" : "none";
    }
  }

  /* =========================
     BUILD CYCLES
     (supports injections + labs + therapies)
  ========================= */

  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function subtractWorkdays(date, n) {
    const x = new Date(date);
    while (n > 0) {
        x.setDate(x.getDate() - 1);
        if (!isWeekend(x)) n--;
    }
    return x;
  }

  function buildCycles(startDate, schema, extraEvents = []) {
    const cycles = [];

    for (let c = 0; c < schema.anzahl_zyklen; c++) {
        const cycleStart = addDays(startDate, c * schema.zyklus_tage);
        const nextCycleStart = addDays(cycleStart, schema.zyklus_tage);

        const days = Array.from({ length: schema.zyklus_tage }, (_, i) => ({
        day: i + 1,
        date: addDays(cycleStart, i),
        events: []
        }));

        schema.events.forEach(ev => {

        let dayIndex = null;

        if (typeof ev.day === "number") {
            dayIndex = ev.day;
        }

        if (typeof ev.workdays_before_next_cycle_start === "number") {
            const target = subtractWorkdays(
            nextCycleStart,
            ev.workdays_before_next_cycle_start
            );
            dayIndex = Math.round((target - cycleStart) / (24 * 60 * 60 * 1000)) + 1;
        }

        if (dayIndex && days[dayIndex - 1]) {
            days[dayIndex - 1].events.push(ev);
        }
        });

        extraEvents.forEach(ev => {
        if (ev.day && days[ev.day - 1]) {
            days[ev.day - 1].events.push(ev);
        }
        });

        cycles.push({ index: c + 1, days });
    }

    return cycles;
  }

  function buildGcsfEvents(enabledEl, selectEl, dayEl) {
    if (!enabledEl?.checked) return { config: null, events: [] };

    const drug = selectEl?.value || "";
    if (!drug) return { config: null, events: [] };

    if (drug === "Filgrastim") {
      const days = [2, 3, 4, 5, 6];
      return {
        config: { drug, multipleDays: days },
        events: days.map((d) => ({ type: "injection", label: drug, day: d }))
      };
    }

    const day = parseInt(dayEl?.value || "2", 10);
    return {
      config: { drug, day },
      events: [{ type: "injection", label: drug, day }]
    };
  }

  /* =========================
     RENDER: HEADER
  ========================= */

  function renderHeader(titleText, startDate) {
    const birthRaw = DOM.geburt?.value || "";
    const birthDate = parseDateInput(birthRaw);

    DOM.patient.innerHTML = `
      <div style="border-bottom:2px solid #333; margin-bottom:20px; padding-bottom:10px;">
        <h1 style="margin:0 0 10px 0; color:#2563eb; font-size:1.8rem;">
          ${safeT("therapyPlanCreation")}: ${titleText}
        </h1>
        <p style="margin:0; font-size:1.1rem; line-height:1.5;">
          <strong>${safeT("patient")}:</strong> ${DOM.vorname.value} ${DOM.nachname.value} |
          <strong>${safeT("birthdate")}:</strong> ${birthDate ? fmtDate(birthDate) : "—"}<br>
          <strong>${safeT("firstTherapyDate")}:</strong> ${fmtDate(startDate)}<br>
          <span style="font-size:0.9rem; color:#666;">
            ${safeT("createdOn")}: ${fmtDate(new Date())}
          </span>
        </p>
      </div>
    `;
  }

  /* =========================
     RENDER: LEGEND
  ========================= */

  function renderLegend(schema, hasAnyInjection, hasAnyLab) {
    const therapies = schema.events.filter((e) => e.type === "therapy");
    const unique = {};
    therapies.forEach((tEv) => (unique[tEv.drug] = tEv));

    const items = Object.values(unique)
      .map(
        (tEv) => `
        <div class="legend-item">
          <div class="legend-bar" style="background:${getDrugColor(tEv.drug)}"></div>
          <span>${tEv.drug}</span>
        </div>
      `
      )
      .join("");

    const injectionItem = hasAnyInjection
      ? `<div class="legend-item"><span>💉</span><span>G-CSF</span></div>`
      : "";

    const labItem = hasAnyLab
      ? `<div class="legend-item"><span>🩸</span><span>${safeT("lab")}</span></div>`
      : "";

    const infoText = `
      <div class="schema-info">
        ${safeT("schemaInfo", schema.zyklus_tage, schema.anzahl_zyklen)}
      </div>
    `;

    return `<div class="legend">${items}${injectionItem}${labItem}</div>${infoText}`;
  }

  /* =========================
     RENDER: GRAPHIC (1 cycle)
  ========================= */

  function renderGraphicOneCycleInto(cycle, targetEl) {
    const locale = getLocale();
    let html = `
      <div class="weekday-header">
        ${cycle.days.slice(0, 7).map((d) =>
          `<div>${d.date.toLocaleDateString(locale, { weekday: "long" })}</div>`
        ).join("")}
      </div>
      <div class="grid">
    `;

    cycle.days.forEach((d) => {
      const therapies = d.events.filter((ev) => ev.type === "therapy");
      const injections = d.events.filter((ev) => ev.type === "injection");
      const labs = d.events.filter((ev) => ev.type === "lab");

      let barHtml = "";
      if (therapies.length > 0) {
        barHtml =
          `<div class="therapy-bars">` +
          therapies
            .map(
              (tEv) =>
                `<div class="bar" style="background:${getDrugColor(tEv.drug)}">${tEv.short || (tEv.drug ? tEv.drug[0] : "")}</div>`
            )
            .join("") +
          `</div>`;
      }

      let iconsHtml = "";

      injections.forEach((inj) => {
        iconsHtml += `
          <div class="icon-block">
            <div class="icon">💉</div>
            <div class="icon-label">${inj.label || inj.drug || "G-CSF"}</div>
          </div>
        `;
      });

      labs.forEach((lab) => {
        iconsHtml += `
          <div class="icon-block">
            <div class="icon">🩸</div>
            <div class="icon-label">
              ${safeT("lab")}
              ${lab.fasting ? `<br><span style="color:#b91c1c;">⚠️ ${safeT("fasting")}</span>` : ""}
            </div>
          </div>
        `;
      });

      // keep your "week start day label" behavior
      const dayLabel = ((d.day - 1) % 7 === 0)
        ? `<div class="day-label">d${d.day}</div>`
        : "";

      html += `
        <div class="day ${isWeekend(d.date) ? "weekend" : ""}">
          ${barHtml}
          <div class="day-content">
            ${iconsHtml}
            ${dayLabel}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    targetEl.innerHTML = html;
  }

  /* =========================
     RENDER: TABLE (all cycles)
  ========================= */

  function renderTableAllCycles(cycles, followUpLabel = null, mainCycleCount = null) {
    let html = `
      <table>
        <thead>
          <tr>
            <th>${safeT("date")}</th>
            <th>${safeT("cycle")}</th>
            <th>${safeT("day")}</th>
            <th>${safeT("measure")}</th>
            <th>${safeT("note")}</th>
          </tr>
        </thead>
        <tbody>
    `;

    cycles.forEach((cyc, index) => {
      cyc.days.forEach((d) => {
        if (!d.events.length) return;

        const measures = d.events
          .map((ev) => {
            if (ev.type === "therapy") return ev.drug;
            if (ev.type === "lab") {
                if (ev.fasting) return `${safeT("lab")} – ⚠️ ${safeT("fasting")}`;
            return safeT("lab");
            }
            if (ev.type === "injection") return `💉 ${ev.label || ev.drug || "G-CSF"}`;
            return ev.drug || ev.label || "";
          })
          .filter(Boolean)
          .join(", ");

        let hint = "";
        if (isWeekend(d.date)) hint = `⚠️ ${safeT("weekend")}`;

        html += `
          <tr>
            <td>${fmtDate(d.date)}</td>
            <td>${cyc.index}</td>
            <td>d${d.day}</td>
            <td>${measures}</td>
            <td class="warning">${hint}</td>
          </tr>
        `;
      });

      // separator row after main therapy
      if (followUpLabel && mainCycleCount && index === mainCycleCount - 1) {
        html += `
          <tr class="followup-separator">
            <td colspan="5">${safeT("switchToFollowUp")}: ${followUpLabel}</td>
          </tr>
        `;
      }
    });

    html += `</tbody></table>`;
    DOM.table.innerHTML = html;
  }

  /* =========================
     SUBMIT / RENDER ALL
  ========================= */

  function submitHandler(e){
    e.preventDefault();
    buildAndStoreStateFromDOM();
    renderAll();
  } 

  function renderAll() {
    const r = AppState.lastRender;
    if (!r) return;

    // title text
    let titleText = r.schema.label;
    if (r.hasFollowUp && r.followSchema) titleText += " → " + r.followSchema.label;

    renderHeader(titleText, r.startDate);

    // Graphic: show first main cycle
    DOM.graphic.innerHTML = "";
    renderGraphicOneCycleInto(r.cyclesMain[0], DOM.graphic);

    // Legend under graphic
    const hasAnyInjection =
      r.allCycles.some((cyc) => cyc.days.some((d) => d.events.some((e) => e.type === "injection")));
    const hasAnyLab =
      r.allCycles.some((cyc) => cyc.days.some((d) => d.events.some((e) => e.type === "lab")));

    const legendWrapper = document.createElement("div");
    legendWrapper.innerHTML = renderLegend(r.schema, hasAnyInjection, hasAnyLab);
    DOM.graphic.appendChild(legendWrapper);

    if (r.hasFollowUp && r.followSchema && r.cyclesFollow) {

      const followWrapper = document.createElement("div");
      followWrapper.classList.add("page-break-before");

      followWrapper.innerHTML = `
        <h2 style="margin-top:2rem;">
          ${safeT("followUpTherapy")}: ${r.followSchema.label}
        </h2>
      `;

      const followGraphic = document.createElement("div");
      followWrapper.appendChild(followGraphic);
      DOM.graphic.appendChild(followWrapper);

      // Render first follow-up cycle
      renderGraphicOneCycleInto(r.cyclesFollow[0], followGraphic);

      // Determine if follow-up has injections or labs
      const followHasInjection =
        r.cyclesFollow.some((cyc) =>
          cyc.days.some((d) => d.events.some((e) => e.type === "injection"))
        );

      const followHasLab =
        r.cyclesFollow.some((cyc) =>
          cyc.days.some((d) => d.events.some((e) => e.type === "lab"))
        );

      // Add legend + schema info for follow-up
      const followLegendWrapper = document.createElement("div");
      followLegendWrapper.innerHTML = renderLegend(
        r.followSchema,
        followHasInjection,
        followHasLab
      );
      followWrapper.appendChild(followLegendWrapper);
    }

    // Table: include follow separator
    if (r.hasFollowUp && r.followSchema) {
      renderTableAllCycles(r.allCycles, r.followSchema.label, r.cyclesMain.length);
    } else {
      renderTableAllCycles(r.allCycles);
    }

    // Support plan rendering
    renderSupportPlan(r);

    // Support dropdown is now filled; printing/rendering support can come next
    updatePrintSupportButton();

    DOM.plan.style.display = "block";
    DOM.plan.scrollIntoView({ behavior: "smooth" });
  }

  function updatePrintSupportButton() {
    if (!DOM.printSupportBtn) return;

    const hasSupportContent = DOM.supportGraphic && DOM.supportGraphic.innerHTML.trim() !== "";
    DOM.printSupportBtn.style.display = hasSupportContent ? "inline-block" : "none";
  }

  function buildAndStoreStateFromDOM() {

    const selected = Object.entries(AppState.schemas).find(
      ([, s]) => s.label.toLowerCase() === (DOM.schemaInput.value || "").toLowerCase()
    );

    if (!selected) return;

    const [schemaKey, schema] = selected;

    const startDate = parseDateInput(DOM.startdatum.value);
    if (!startDate) return;

    const hasFollowUp = !!DOM.hasFollowUp?.checked;

    const gcsfMain = buildGcsfEvents(DOM.gcsfEnabled, DOM.gcsfSelect, DOM.gcsfDay);
    const gcsfFollow = buildGcsfEvents(DOM.gcsfEnabledFollow, DOM.gcsfSelectFollow, DOM.gcsfDayFollow);

    const cyclesMain = buildCycles(startDate, schema, gcsfMain.events);
    let allCycles = [...cyclesMain];

    let followSchema = null;
    let followKey = null;
    let cyclesFollow = null;

    if (hasFollowUp) {
      followKey = DOM.followUpSelect?.value || null;
      followSchema = followKey ? AppState.schemas[followKey] : null;

      if (followSchema) {
        const followStart = addDays(startDate, schema.zyklus_tage * schema.anzahl_zyklen);
        cyclesFollow = buildCycles(followStart, followSchema, gcsfFollow.events);
        allCycles = [...cyclesMain, ...cyclesFollow];
      }
    }

    AppState.lastRender = {
      schemaKey,
      schema,
      startDate,
      hasFollowUp,
      followKey,
      followSchema,
      cyclesMain,
      cyclesFollow,
      allCycles,
      gcsfMain,
      gcsfFollow
    };
  }

  function rerenderIfNeeded() {
    if (!AppState.lastRender) return;
    buildAndStoreStateFromDOM();
    renderAll();
  }
  /* =========================
     PRINT FUNCTIONS
  ========================= */

  function clearPrintClasses() {
    document.body.classList.remove("print-graphic");
    document.body.classList.remove("print-table");
    document.body.classList.remove("print-support");
  }

  window.printGraphic = function () {
    clearPrintClasses();
    document.body.classList.add("print-graphic");
    window.print();
    setTimeout(clearPrintClasses, 100);
  };

  window.printTable = function () {
    clearPrintClasses();
    document.body.classList.add("print-table");
    window.print();
    setTimeout(clearPrintClasses, 100);
  };

  window.printSupport = function () {
    clearPrintClasses();
    document.body.classList.add("print-support");
    window.print();
    setTimeout(clearPrintClasses, 100);
  };

})();