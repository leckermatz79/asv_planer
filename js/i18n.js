/* =========================================
   I18N MODULE
   Standalone, framework-free
========================================= */

let currentLang = "de";

/* ===== Locale & Weekday Maps (presentation layer) ===== */

window.localeMap = {
  de: "de-DE",
  en: "en-GB",
  tr: "tr-TR",
  pl: "pl-PL",
  ru: "ru-RU",
  ua: "uk-UA"
};

window.weekdayMap = {
  de: ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  tr: ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"],
  pl: ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"],
  ru: ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
  ua: ["Неділя","Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота"]
};

/* ======================================================= */

const translations = {
  de: {
    therapyPlanCreation: "Therapieplan Erstellung",
    language: "Sprache",
    patient: "Patient",
    birthdate: "Geburtsdatum",
    firstTherapyDate: "Datum erste Therapie",
    createdOn: "Erstellt am",
    graphicOverview: "Grafische Übersicht (1 Zyklus)",
    tableOverview: "Tabellarische Übersicht (alle Zyklen)",
    date: "Datum",
    cycle: "Zyklus",
    day: "Tag",
    measure: "Maßnahme",
    note: "Hinweis",
    lab: "Labor",
    fasting: "nüchtern!",
    weekend: "Wochenende",
    holiday: "Feiertag",
    switchToFollowUp: "Umstellung auf Folgetherapie",
    followUpTherapy: "Folgetherapie",
    schemaInfo: (days, cycles) =>
      `Dieses Behandlungsschema umfasst ${days} Tage pro Zyklus und wird insgesamt über ${cycles} Zyklen durchgeführt.`,
    footerBlock: `Telefonnummer GynOnko Ambulanz: 0241/6006-1685<br>24/7 Notfall-Rufnummer: 0241/6006-0 (mit diensthabender Gynäkologin verbinden lassen)`
  },
  en: {
    therapyPlanCreation: "Treatment Plan Creation",
    language: "Language",
    patient: "Patient",
    birthdate: "Date of Birth",
    firstTherapyDate: "Date of First Treatment",
    createdOn: "Created on",
    graphicOverview: "Graphical Overview (1 Cycle)",
    tableOverview: "Tabular Overview (All Cycles)",
    date: "Date",
    cycle: "Cycle",
    day: "Day",
    measure: "Procedure",
    note: "Note",
    lab: "Laboratory",
    fasting: "fasting!",
    weekend: "Weekend",
    holiday: "Public holiday",
    switchToFollowUp: "Umstellung auf Folgetherapie (#en)",
    followUpTherapy: "Folgetherapie (#en)",
    schemaInfo: (days, cycles) =>
      `This treatment regimen includes ${days} days per cycle and is administered over ${cycles} cycles.`,
    footerBlock: `Gynecologic Oncology Outpatient Clinic: 0241/6006-1685<br>24/7 Emergency Hotline: 0241/6006-0 (ask to be connected to the on-call gynecologist)`
  },
  tr: {
    therapyPlanCreation: "Tedavi Planı Oluşturma",
    language: "Dil",
    patient: "Hasta",
    birthdate: "Doğum Tarihi",
    firstTherapyDate: "İlk Tedavi Tarihi",
    createdOn: "Oluşturulma Tarihi",
    graphicOverview: "Grafiksel Genel Bakış (1 Döngü)",
    tableOverview: "Tablo Halinde Genel Bakış (Tüm Döngüler)",
    date: "Tarih",
    cycle: "Döngü",
    day: "Gün",
    measure: "Uygulama",
    note: "Not",
    lab: "Laboratuvar",
    fasting: "aç karnına!",
    weekend: "Hafta sonu",
    holiday: "Resmi tatil",
    switchToFollowUp: "Umstellung auf Folgetherapie (#tr)",
    followUpTherapy: "Folgetherapie (#tr)",
    schemaInfo: (days, cycles) =>
      `Bu tedavi şeması her döngüde ${days} gün sürer ve toplamda ${cycles} döngü boyunca uygulanır.`,
    footerBlock: `Jinekolojik Onkoloji Polikliniği: 0241/6006-1685<br>7/24 Acil Telefon Hattı: 0241/6006-0 (nöbetçi jinekolog ile bağlantı kurun)`
  },
  pl: {
    therapyPlanCreation: "Tworzenie planu terapii",
    language: "Język",
    patient: "Pacjent",
    birthdate: "Data urodzenia",
    firstTherapyDate: "Data pierwszej terapii",
    createdOn: "Utworzono dnia",
    graphicOverview: "Przegląd graficzny (1 cykl)",
    tableOverview: "Przegląd tabelaryczny (wszystkie cykle)",
    date: "Data",
    cycle: "Cykl",
    day: "Dzień",
    measure: "Procedura",
    note: "Uwagi",
    lab: "Laboratorium",
    fasting: "na czczo!",
    weekend: "Weekend",
    holiday: "Święto",
    switchToFollowUp: "Umstellung auf Folgetherapie (#pl)",
    followUpTherapy: "Folgetherapie (#pl)",
    schemaInfo: (days, cycles) =>
      `Ten schemat leczenia obejmuje ${days} dni na cykl i jest realizowany przez ${cycles} cykli.`,
    footerBlock: `Poradnia Onkologii Ginekologicznej: 0241/6006-1685<br>Całodobowa linia alarmowa: 0241/6006-0 (poproś o połączenie z lekarzem ginekologiem dyżurnym)`
  },

  ru: {
    therapyPlanCreation: "Создание плана терапии",
    language: "Язык",
    patient: "Пациент",
    birthdate: "Дата рождения",
    firstTherapyDate: "Дата первой терапии",
    createdOn: "Создано",
    graphicOverview: "Графический обзор (1 цикл)",
    tableOverview: "Табличный обзор (все циклы)",
    date: "Дата",
    cycle: "Цикл",
    day: "День",
    measure: "Процедура",
    note: "Примечание",
    lab: "Лаборатория",
    fasting: "натощак!",
    weekend: "Выходные",
    holiday: "Праздничный день",
    switchToFollowUp: "Umstellung auf Folgetherapie (#ru)",
    followUpTherapy: "Folgetherapie (#ru)",
    schemaInfo: (days, cycles) =>
      `Данная схема лечения включает ${days} дней на цикл и проводится в течение ${cycles} циклов.`,
    footerBlock: `Гинекологическая онкологическая амбулатория: 0241/6006-1685<br>Круглосуточная горячая линия: 0241/6006-0 (попросите соединить с дежурным гинекологом)`
  },
  ua: {
    therapyPlanCreation: "Створення плану терапії",
    language: "Мова",
    patient: "Пацієнт",
    birthdate: "Дата народження",
    firstTherapyDate: "Дата першої терапії",
    createdOn: "Створено",
    graphicOverview: "Графічний огляд (1 цикл)",
    tableOverview: "Табличний огляд (усі цикли)",
    date: "Дата",
    cycle: "Цикл",
    day: "День",
    measure: "Процедура",
    note: "Примітка",
    lab: "Лабораторія",
    fasting: "натще!",
    weekend: "Вихідні",
    holiday: "Святковий день",
    switchToFollowUp: "Umstellung auf Folgetherapie (#ua)",
    followUpTherapy: "Folgetherapie (#ua)",
    schemaInfo: (days, cycles) =>
      `Ця схема лікування включає ${days} днів на цикл і проводиться протягом ${cycles} циклів.`,
    footerBlock: `Гінекологічна онкологічна амбулаторія: 0241/6006-1685<br>Цілодобова гаряча лінія: 0241/6006-0 (попросіть з'єднати з черговим гінекологом)`
  }

  // weitere Sprachen hier ergänzen
};

/* ===== Translation function ===== */

function t(key, ...params) {
  const entry = translations[currentLang]?.[key];

  if (typeof entry === "function") {
    return entry(...params);
  }

  return entry || key;
}

/* ===== Apply translations to DOM ===== */

function applyTranslations() {

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const key = el.dataset.i18nHtml;
    el.innerHTML = t(key);
  });

}

/* ===== Language switch ===== */

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("therapyplanner_lang", lang);
  applyTranslations();
}

/* ===== Init on load ===== */

document.addEventListener("DOMContentLoaded", () => {

  const savedLang = localStorage.getItem("therapyplanner_lang");
  if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
  }

  const langSelect = document.getElementById("languageSelect");
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener("change", e => {
      setLanguage(e.target.value);
    });
  }

  applyTranslations();
});