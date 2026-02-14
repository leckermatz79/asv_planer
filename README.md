# 🏥 Therapieplan Tool – Onkologische Chemotherapie (v1.0)

Ein vollständig offlinefähiges, browserbasiertes Tool zur Erstellung strukturierter Therapiepläne für onkologische Chemotherapieschemata.

Entwickelt für den Einsatz in klinischen Umgebungen mit restriktiver IT-Infrastruktur (kein Server, keine lokale Installation, kein Datenbankzugriff).

---

## 🎯 Ziel des Projekts

Dieses Tool ermöglicht:

- 📅 Automatische Berechnung von Chemotherapiezyklen
- 🧪 Integration von Laborterminen (inkl. „nüchtern“-Kennzeichnung)
- 💉 Optionale G-CSF-Integration
- 💊 Begleitmedikationspläne (z. B. Antiemese)
- 📊 Grafische Darstellung eines Referenzzyklus
- 📋 Tabellarische Übersicht aller Zyklen
- 🖨 Druckoptimierte Ausgabe (Grafik / Tabelle / Begleitmedikation)

Das Tool funktioniert vollständig lokal über eine einzelne HTML-Datei.

---

## 🧩 Technische Eigenschaften

- Reines **HTML + CSS + Vanilla JavaScript**
- Keine externen Abhängigkeiten
- Keine Datenbank
- Kein Server
- Kein Build-System
- 100 % offlinefähig (`file:///` kompatibel)
- Druckoptimiert via `@media print`

---

## 🖥 Nutzung

1. `index.html` lokal öffnen
2. Patientendaten eingeben
3. Chemotherapie-Schema auswählen
4. Optional:
   - Begleitmedikation
   - G-CSF-Gabe
   - Anschlusstherapie
5. „Plan berechnen“ klicken
6. Gewünschten Druckmodus wählen:
   - Grafik (Querformat)
   - Tabelle (Hochformat)
   - Begleitmedikation

PDF-Export erfolgt über den Browser-Druckdialog („Als PDF speichern“).

---

## 🧠 Funktionsübersicht

### Chemotherapie-Schemata

Definiert über strukturierte JSON-Objekte:

```javascript
{
  "label": "EC q3w",
  "zyklus_tage": 21,
  "anzahl_zyklen": 4,
  "events": [
    { "type": "therapy", "drug": "Epirubicin", "short": "E", "day": 1 },
    { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
  ]
}