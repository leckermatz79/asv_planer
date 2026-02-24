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
    therapyPlanCreation: "Therapieplan",
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
    lab: "Laborkontrolle",
    fasting: "nüchtern!",
    weekend: "Wochenende",
    holiday: "Feiertag",
    switchToFollowUp: "Umstellung auf Folgetherapie",
    followUpTherapy: "Folgetherapie",
    schemaInfo: (days, cycles) =>
      `Dieses Behandlungsschema umfasst <strong>${days} Tage pro Zyklus</strong> und wird insgesamt über <strong>${cycles} Zyklen </strong>durchgeführt.`,
    footerBlock: `Telefonnummer GynOnko Ambulanz: 0241/6006-1685<br>24/7 Notfall-Rufnummer: 0241/6006-0 (mit diensthabender Gynäkologin verbinden lassen)`,
    morning: "(morgens)",
    noon: "(mittags)",
    evening: "(abends)",
    injection: "Injektion",
    nausea: "Bei Übelkeit:",
    ondansetronHint:
      "Einnahme einer 8 mg Ondansetron Schmelztablette (im Mund zergehen lassen). Falls keine Besserung nach 20–30 Minuten: Notfallnummer anrufen."
  },
  en: {
    therapyPlanCreation: "Treatment Plan",
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
    lab: "Laboratory tests",
    fasting: "fasting!",
    weekend: "Weekend",
    holiday: "Public holiday",
    switchToFollowUp: "Switch to Follow-Up Therapy",
    followUpTherapy: "Follow-Up Therapy",
    schemaInfo: (days, cycles) =>
      `This treatment regimen includes <strong>${days} days per cycle</strong> and is administered over <strong>${cycles} cycles</strong>.`,
    footerBlock: `Gynecologic Oncology Outpatient Clinic: 0241/6006-1685<br>24/7 Emergency Hotline: 0241/6006-0 (ask to be connected to the on-call gynecologist)`,
    morning: "(morning)",
    noon: "(noon)",
    evening: "(evening)",
    injection: "Injection",
    nausea: "In case of nausea:",
    ondansetronHint:
      "Take one 8 mg Ondansetron melt tablet (let it dissolve in your mouth). If no improvement after 20–30 minutes: Call emergency number."  
  },
  tr: {
    therapyPlanCreation: "Tedavi Planı",
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
    lab: "Laboratuvar kontrolü",
    fasting: "aç karnına!",
    weekend: "Hafta sonu",
    holiday: "Resmi tatil",
    switchToFollowUp: "Takip tedavisine geçin",
    followUpTherapy: "Takip Tedavisi",
    schemaInfo: (days, cycles) =>
      `Bu tedavi şeması her döngüde <strong>${days} gün sürer</strong> ve toplamda <strong>${cycles} döngü boyunca uygulanır</strong>.`,
    footerBlock: `Jinekolojik Onkoloji Polikliniği: 0241/6006-1685<br>7/24 Acil Telefon Hattı: 0241/6006-0 (nöbetçi jinekolog ile bağlantı kurun)`,
    morning: "(sabah)",
    noon: "(öğle)",
    evening: "(akşam)",
    injection: "Enjeksiyon",
    nausea: "Bulantı durumunda:",
    ondansetronHint:
      "Bir adet 8 mg Ondansetron eritilebilir tablet alın (ağzınızda eritin). 20–30 dakika sonra iyileşme olmazsa: Acil numarayı arayın."
  },
  pl: {
    therapyPlanCreation: "Planu terapii",
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
    lab: "Badania laboratoryjne",
    fasting: "na czczo!",
    weekend: "Weekend",
    holiday: "Święto",
    switchToFollowUp: "Przejdź do terapii uzupełniającej",
    followUpTherapy: "Terapia uzupełniająca",
    schemaInfo: (days, cycles) =>
      `Ten schemat leczenia obejmuje <strong>${days} dni na cykl</strong> i jest realizowany przez <strong>${cycles} cykli</strong>.`,
    footerBlock: `Poradnia Onkologii Ginekologicznej: 0241/6006-1685<br>Całodobowa linia alarmowa: 0241/6006-0 (poproś o połączenie z lekarzem ginekologiem dyżurnym)`,
    morning: "(rano)",
    noon: "(w południe)",
    evening: "(wieczorem)",
    injection: "Zastrzyk",
    nausea: "W przypadku nudności:",
    ondansetronHint:
      "Weź jedną tabletkę do rozpuszczania 8 mg Ondansetronu (niech się rozpuści w ustach). Jeśli po 20–30 minutach nie będzie poprawy: Zadzwoń pod numer alarmowy."
  },

  ru: {
    therapyPlanCreation: "Плана терапии",
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
    lab: "Лабораторные анализы",
    fasting: "натощак!",
    weekend: "Выходные",
    holiday: "Праздничный день",
    switchToFollowUp: "Перейти к поддерживающей терапии",
    followUpTherapy: "Поддерживающая терапия",
    schemaInfo: (days, cycles) =>
      `Данная схема лечения включает <strong>${days} дней на цикл</strong> и проводится в течение <strong>${cycles} циклов</strong>.`,
    footerBlock: `Гинекологическая онкологическая амбулатория: 0241/6006-1685<br>Круглосуточная горячая линия: 0241/6006-0 (попросите соединить с дежурным гинекологом)`,
    morning: "(утром)",
    noon: "(в полдень)",
    evening: "(вечером)",
    injection: "Инъекция",
    nausea: "При тошноте:",
    ondansetronHint:
      "Примите одну таблетку для рассасывания 8 мг Ондансетрона (пусть растворится во рту). Если через 20–30 минут не будет улучшения: Позвоните по экстренному номеру."
  },
  ua: {
    therapyPlanCreation: "Плану терапії",
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
    lab: "Лабораторні аналізи",
    fasting: "натще!",
    weekend: "Вихідні",
    holiday: "Святковий день",
    switchToFollowUp: "Перейти до терапії після основної",
    followUpTherapy: "Терапія після основної",
    schemaInfo: (days, cycles) =>
      `Ця схема лікування включає <strong>${days} днів на цикл</strong> і проводиться протягом <strong>${cycles} циклів</strong>.`,
    footerBlock: `Гінекологічна онкологічна амбулаторія: 0241/6006-1685<br>Цілодобова гаряча лінія: 0241/6006-0 (попросіть з'єднати з черговим гінекологом)`,
    morning: "(вранці)",
    noon: "(в полудень)",
    evening: "(вечором)",
    injection: "Ін'єкція",
    nausea: "При нудоті:",
    ondansetronHint:
      "Прийміть одну таблетку для розсмоктування 8 мг Ондансетрона (нехай розчиниться у роті). Якщо через 20–30 хвилин не буде покращення: Зателефонуйте за екстреним номером."
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