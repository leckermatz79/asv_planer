/* =========================================
   THERAPY PLANER – APP LOGIC
========================================= */

const schemas = JSON.parse(document.getElementById("schemas").textContent);
const schemaInput = document.getElementById("schemaInput");
const schemaList = document.getElementById("schemaList");

const formEl = document.getElementById("therapyForm");
const vornameEl = document.getElementById("vorname");
const nachnameEl = document.getElementById("nachname");
const geburtEl = document.getElementById("geburt");
const startEl = document.getElementById("startdatum");

const planEl = document.getElementById("plan");
const graphicEl = document.getElementById("graphic");
const patientEl = document.getElementById("patient");
const tableEl = document.getElementById("table");

/* =========================
   Helpers
========================= */

const MS_DAY = 24 * 60 * 60 * 1000;

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const fmt = d => {
  const locale = (window.localeMap && window.localeMap[currentLang]) || "de-DE";
  return d.toLocaleDateString(locale);
};

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function buildCycles(startDate, schema) {

  const cycles = [];

  for (let c = 0; c < schema.anzahl_zyklen; c++) {

    const cycleStart = addDays(startDate, c * schema.zyklus_tage);

    const days = Array.from({ length: schema.zyklus_tage }, (_, i) => ({
      day: i + 1,
      date: addDays(cycleStart, i),
      events: []
    }));

    schema.events.forEach(ev => {
      if (typeof ev.day === "number") {
        days[ev.day - 1].events.push(ev);
      }
    });

    cycles.push({ index: c + 1, days });
  }

  return cycles;
}

/* =========================
   Rendering
========================= */

function renderLegend(schema) {

  const therapies = schema.events.filter(e => e.type === "therapy");

  const unique = {};
  therapies.forEach(t => unique[t.short || t.drug] = t);

  const items = Object.values(unique).map(t => `
    <div class="legend-item">
      <div class="legend-bar" style="background:#6b7280"></div>
      <span>${t.drug}</span>
    </div>
  `).join("");

  const infoText = `
    <div class="schema-info">
      ${t("schemaInfo", schema.zyklus_tage, schema.anzahl_zyklen)}
    </div>
  `;

  return `<div class="legend">${items}</div>${infoText}`;
}

function renderGraphicOneCycle(cycle) {

  let html = `
    <div class="weekday-header">
      ${cycle.days.slice(0,7)
        .map(d => `<div>${(window.weekdayMap && window.weekdayMap[currentLang] ? window.weekdayMap[currentLang] : window.weekdayMap.de)[d.date.getDay()]}</div>`)
        .join("")}
    </div>
    <div class="grid">
  `;

  cycle.days.forEach(d => {

    const therapies = d.events.filter(ev => ev.type === "therapy");

    html += `
      <div class="day ${isWeekend(d.date) ? "weekend" : ""}">
        <div class="day-content">
          ${therapies.map(t => `
            <div class="bar">${t.short}</div>
          `).join("")}
          <div class="day-label">d${d.day}</div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  graphicEl.innerHTML = html;
}

function renderTableAllCycles(cycles) {

  let html = `
    <table>
      <thead>
        <tr>
          <th>${t("date")}</th>
          <th>${t("cycle")}</th>
          <th>${t("day")}</th>
          <th>${t("measure")}</th>
        </tr>
      </thead>
      <tbody>
  `;

  cycles.forEach(cycle => {

    cycle.days.forEach(d => {

      if (!d.events.length) return;

      const measures = d.events
        .map(ev => ev.drug || ev.label)
        .join(", ");

      html += `
        <tr>
          <td>${fmt(d.date)}</td>
          <td>${cycle.index}</td>
          <td>d${d.day}</td>
          <td>${measures}</td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;

  tableEl.innerHTML = html;
}

/* =========================
   Initialisation (populate dropdowns)
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* Schema-Datalist befüllen */
  if (schemaList) {
    schemaList.innerHTML = "";
    Object.values(schemas).forEach(schema => {
      const option = document.createElement("option");
      option.value = schema.label;
      schemaList.appendChild(option);
    });
  }

  /* Support-Select zunächst leer initialisieren */
  const supportSelect = document.getElementById("supportSelect");
  if (supportSelect) {
    supportSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "—";
    supportSelect.appendChild(opt);
  }

});

/* =========================
   Form Submit
========================= */

formEl.addEventListener("submit", e => {

  e.preventDefault();

  const startDate = new Date(startEl.value + "T12:00:00");

  const selected = Object.entries(schemas).find(
    ([key, schema]) =>
      schema.label.toLowerCase().includes(schemaInput.value.toLowerCase())
  );

  if (!selected) {
    alert("Bitte ein gültiges Schema auswählen.");
    return;
  }

  const [, schema] = selected;

  const cycles = buildCycles(startDate, schema);

  /* Grafik */
  renderGraphicOneCycle(cycles[0]);

  const legendWrapper = document.createElement("div");
  legendWrapper.innerHTML = renderLegend(schema);
  graphicEl.appendChild(legendWrapper);

  /* Tabelle */
  renderTableAllCycles(cycles);

  /* Patientenblock */

  patientEl.innerHTML = `
    <div style="border-bottom:2px solid #333; margin-bottom:20px;">
      <h1>${t("therapyPlanCreation")}: ${schema.label}</h1>
      <p>
        <strong>${t("patient")}:</strong> ${vornameEl.value} ${nachnameEl.value}<br>
        <strong>${t("birthdate")}:</strong> ${geburtEl.value || "—"}<br>
        <strong>${t("firstTherapyDate")}:</strong> ${fmt(startDate)}
      </p>
    </div>
  `;

  planEl.style.display = "block";
});