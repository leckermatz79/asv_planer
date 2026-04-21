# FormGenerator – Architektur-Blueprint v1.0

Dieses Dokument beschreibt die geplante Erweiterung des Therapieplaners um eine
Schema-Verwaltung (Admin-UI) sowie ein zukunftsfähiges Persistierungskonzept.
Es dient als verbindliche Grundlage für die Implementierung durch Claude Code.

---

## Ziele dieser Phase

1. **Schema-Admin-UI** – Schemata (Chemo, Support, G-CSF) browserbasiert verwalten (CRUD)
2. **Persistierungsmodul** – Patientenindividuelle Therapiepläne datenschutzkonform speichern
3. **Electron-Readiness** – Architektur so gestalten, dass ein späterer Electron-Wrapper
   minimalen Umbauaufwand erfordert

---

## Neue Dateistruktur

```
FormGenerator/
├── index.html              (unverändert – bestehende Planer-UI)
├── admin.html              (NEU – Schema-Verwaltung + Einstellungen)
├── resolver.html           (NEU – Plan aus Hash/Datei rekonstruieren)
├── CLAUDE.md
├── css/
│   ├── main.css            (unverändert)
│   └── admin.css           (NEU – Styles für Admin-UI)
└── js/
    ├── app.js              (minimale Anpassung – SchemaStore statt window.chemoSchemas)
    ├── chemoSchemas.js     (unverändert – bleibt "source of truth" für Produktion)
    ├── gcsfSchemas.js      (unverändert)
    ├── supportSchemas.js   (unverändert)
    ├── i18n.js             (unverändert)
    ├── config.js           (NEU – Konfigurationsmodul, Defaults + Lade/Speicher-Logik)
    ├── persistence.js      (NEU – Speicher/Lade-Logik, abstrahiert)
    ├── schemaStore.js      (NEU – Runtime-Schema-Verwaltung, lädt aus localStorage oder .js-Dateien)
    └── admin.js            (NEU – Logik für admin.html)
```

---

## Modulverantwortlichkeiten

### `js/config.js`
**Zweck:** Zentrale Konfigurationsverwaltung. Einzige Stelle im Code, die Anwendungseinstellungen
liest und schreibt. Alle anderen Module holen sich ihre Konfiguration von hier – nie direkt aus
`localStorage` oder einer Datei.

```js
// Öffentliche API:
Config.get(key)              // Gibt Konfigurationswert zurück, Fallback auf Default
Config.set(key, value)       // Setzt einen Wert und persistiert sofort
Config.getAll()              // Gibt das vollständige Konfigurationsobjekt zurück
Config.reset()               // Setzt alle Werte auf Defaults zurück (nach Bestätigung)
```

**Konfigurationsoptionen (mit Defaults):**

```js
const DEFAULTS = {

  // Speicherverhalten
  storage: {
    mode: "local",               // "local" (localStorage) | "file" (Electron: Dateisystem)
    exportPath: "",              // Bevorzugter Export-Ordner (nur Electron, sonst ignoriert)
    autoSave: false,             // Automatisch speichern nach Plan-Generierung (Phase 2)
  },

  // Anwendungsdarstellung
  ui: {
    language: "de-DE",           // Standardsprache (ergänzt bestehenden localStorage-Key)
    theme: "light",              // "light" | "dark" | "system" (für spätere Implementierung)
    clinicName: "",              // Klinikname für Druckheader (leer = nicht anzeigen)
  },

  // Druckoptionen
  print: {
    showLogo: false,             // Klinik-Logo im Druckheader anzeigen (Phase 2)
    defaultView: "table",        // "table" | "graphic" – welche Ansicht beim Drucken default
    showSourceReference: true,   // Quellenangabe der Schemata im Ausdruck anzeigen
  },

  // Admin-Optionen
  admin: {
    allowCustomSchemas: true,    // Custom Schemata über Admin-UI erlauben
    requireSourceReference: false, // Quellenangabe beim Erstellen/Bearbeiten erzwingen
  },

};
```

**Implementierungshinweis:**
- Phase 1: Werte werden via `persistence.js` in `localStorage` unter dem Key
  `therapyplanner_config` gespeichert
- Phase 2 (Electron): Nur `config.js` intern anpassen, alle Aufrufer bleiben gleich
- `Config.get("storage.mode")` unterstützt Dot-Notation für verschachtelte Keys
- `config.js` wird **vor allen anderen Modulen** in `index.html` und `admin.html` geladen,
  da `persistence.js` und `schemaStore.js` ggf. auf Konfigurationswerte zugreifen

---

### `js/persistence.js`
**Zweck:** Einzige Stelle im Code, die sich um Speichern und Laden kümmert.
Alle anderen Module rufen nur diese API auf – nie direkt `localStorage` oder `File API`.

```js
// Öffentliche API:
Persistence.save(key, data)          // Speichert JSON unter einem Schlüssel
Persistence.load(key)                // Lädt JSON, gibt null zurück wenn nicht vorhanden
Persistence.remove(key)              // Löscht einen Eintrag
Persistence.list(prefix)            // Listet alle Keys mit gegebenem Prefix
Persistence.exportToFile(key, data) // Löst Browser-Download einer .json-Datei aus
Persistence.importFromFile(file)    // Liest File-Objekt, gibt geparsten JSON zurück (Promise)
Persistence.encodeToString(data)    // Serialisiert + Base64-kodiert (für KIS-Feld)
Persistence.decodeFromString(str)   // Dekodiert Base64-String zurück zu Objekt
```

**Implementierungshinweis:**
- Phase 1: `save/load` nutzen `localStorage` mit Namespace-Prefix `therapyplanner_`
- Phase 2 (Electron): Nur `persistence.js` muss angepasst werden – alle Aufrufer bleiben gleich
- `exportToFile` / `importFromFile` funktionieren in beiden Phasen identisch (File API)

---

### `js/schemaStore.js`
**Zweck:** Stellt zur Laufzeit alle Schemata bereit – entweder aus den statischen `.js`-Dateien
oder aus benutzerdefinierten Einträgen in `localStorage`.

```js
// Öffentliche API:
SchemaStore.getChemoSchemas()        // Gibt Merge aus chemoSchemas.js + custom Einträgen zurück
SchemaStore.getSupportSchemas()      // analog
SchemaStore.getGcsfSchemas()         // analog
SchemaStore.saveCustomSchema(type, schema)   // type: 'chemo' | 'support' | 'gcsf'
SchemaStore.deleteCustomSchema(type, id)
SchemaStore.exportAllCustom()        // Gibt alle custom Schemata als JSON zurück
SchemaStore.importCustom(json)       // Importiert custom Schemata (Merge, kein Überschreiben)
```

**Wichtig:** Die bestehenden `chemoSchemas.js`, `supportSchemas.js`, `gcsfSchemas.js` werden
**nicht verändert**. `schemaStore.js` liest sie als Basiswerte und mergt custom Einträge darüber.
Custom Schemata werden via `persistence.js` in `localStorage` gespeichert.

**Integration in `index.html`:**
`app.js` muss minimal angepasst werden: `window.chemoSchemas` → `SchemaStore.getChemoSchemas()`
an den zwei oder drei Stellen, wo Dropdowns befüllt werden. Keine weitere Änderung an `app.js`.

---

### `admin.html` + `js/admin.js`
**Zweck:** Eigenständige HTML-Seite für die Schema-Verwaltung. Erreichbar über einen Link
in `index.html` (z.B. kleines Zahnrad-Icon oben rechts).

**Funktionsumfang Admin-UI:**

#### Tab 1 – Chemotherapie-Schemata
- Tabelle aller vorhandenen Schemata (Built-in + Custom), mit Markierung welche Herkunft
- Buttons: Neu erstellen | Bearbeiten | Duplizieren | Löschen (nur Custom) | Exportieren
- Formular-Editor für ein Schema:
  - `label` (Textfeld)
  - `cycleDays` (Zahl)
  - `numCycles` (Zahl)
  - `events[]` – dynamische Liste:
    - Typ: `therapy` | `lab`
    - Tag (day), Medikament (drug), Dosis, Einheit
    - Flags: `fasting`, `workdays_before_next_cycle_start`
  - Quellenangabe: Freitext (z.B. "Onkopedia 2024", "Blaue Reihe Bd. 3, S. 47")
  - Versionsfeld (z.B. "1.0", "2024-03")

#### Tab 2 – Support-Schemata
- Analog zu Tab 1, angepasst an die Struktur von `supportSchemas.js`

#### Tab 3 – G-CSF-Schemata
- Analog, angepasst an `gcsfSchemas.js`

#### Tab 4 – Import / Export
- Alle custom Schemata als eine `.json`-Datei exportieren
- `.json`-Datei importieren (mit Konflikt-Handling: überschreiben / umbenennen / überspringen)
- "Werkszustand wiederherstellen" (löscht alle custom Schemata nach Bestätigung)

#### Tab 5 – Einstellungen
Formular mit allen Konfigurationsoptionen aus `config.js`. Struktur:

**Abschnitt "Speicherung":**
- Speichermodus (Dropdown: localStorage / Datei)
- Export-Standardpfad (Textfeld, nur aktiv wenn Modus = Datei)

**Abschnitt "Darstellung":**
- Standardsprache (Dropdown mit den 6 vorhandenen Locales aus `i18n.js`)
- Klinikname (Textfeld, erscheint im Druckheader)

**Abschnitt "Druckoptionen":**
- Standard-Druckansicht (Tabelle / Grafik)
- Quellenangabe im Ausdruck anzeigen (Checkbox)

**Abschnitt "Administration":**
- Custom Schemata erlauben (Checkbox)
- Quellenangabe beim Erstellen erzwingen (Checkbox)

Unten: Button "Einstellungen speichern" + Button "Auf Standardwerte zurücksetzen"

---

### `resolver.html`
**Zweck:** Einen gespeicherten Therapieplan anhand einer UUID oder eines kodierten Strings
rekonstruieren und anzeigen.

**Ablauf:**
1. Eingabefeld: UUID **oder** Base64-String einfügen
2. Resolver erkennt automatisch den Typ
3. Bei UUID: lädt JSON aus `localStorage` via `Persistence.load(uuid)`
4. Bei Base64-String: dekodiert via `Persistence.decodeFromString(str)`
5. Formular in `index.html` wird mit den geladenen Daten befüllt (oder direkt gerendert)
6. Benutzer ergänzt Name + Geburtsdatum → Plan wird generiert

---

## Persistierungskonzept für Patientenpläne

### Datenschutz-Trennung
Gespeichert wird **ausschließlich:**
- Schema-Bezeichnungen (z.B. `"ECq2w"`, `"Akynzeo-Olanzapin"`)
- Startdatum
- G-CSF-Konfiguration
- Individuelle Anpassungen (falls vorhanden)

**Niemals gespeichert:** Name, Geburtsdatum, Fallnummer, oder andere identifizierende Daten.

### Variante A – UUID + lokale Datei (Standard, empfohlen)
```
Arzt füllt Formular aus
        ↓
"Speichern" → UUID generieren → Daten als JSON in localStorage unter UUID
        ↓
UUID (z.B. f3a9bc12-...) → Arzt kopiert in KIS-Freitextfeld
        ↓
Später: UUID in resolver.html eingeben → Plan rekonstruiert → Name/GD manuell ergänzen
```

### Variante B – Alles im String (optional, für KIS-Integration)
```
Arzt füllt Formular aus
        ↓
"Als String kopieren" → Daten JSON-serialisiert + gzip-komprimiert + Base64-kodiert
        ↓
~800–1500 Zeichen langer String → in KIS einfügen (falls Feldlänge ausreicht)
        ↓
Später: String in resolver.html → Plan direkt rekonstruiert (keine lokale Datei nötig)
```

**Hinweis zu Variante B:** Keine kryptografische Hashfunktion – der String ist vollständig
umkehrbar. Das ist gewollt: Ziel ist Rekonstruierbarkeit, nicht Verschlüsselung.
Sensible Daten (Name, GD) sind ohnehin nicht enthalten.

---

## Implementierungsreihenfolge (für Claude Code)

### Schritt 1 – `config.js` erstellen
Defaults definieren, `Config.get/set/getAll/reset` implementieren.
Speicherung via `localStorage` direkt (noch ohne `persistence.js`, da `config.js` zuerst geladen wird).
Mit `console.log`-Tests verifizieren.

### Schritt 2 – `persistence.js` erstellen
Alle API-Funktionen implementieren. `Persistence.save/load` nutzen intern `Config.get("storage.mode")`
um zu entscheiden, wie gespeichert wird. Noch keine UI. Mit `console.log`-Tests verifizieren.

### Schritt 3 – `schemaStore.js` erstellen
Built-in Schemata einlesen, custom Schemata aus `localStorage` mergen.
`app.js` minimal anpassen (Dropdown-Befüllung umstellen auf `SchemaStore.getChemoSchemas()` etc.).
Sicherstellen, dass `index.html` weiterhin identisch funktioniert.

### Schritt 4 – `admin.html` + `admin.css` + `admin.js` (Grundgerüst)
Navigation (Tabs 1–5), leere Panels, Link von `index.html` zur Admin-Seite (Zahnrad-Icon).
Ladereihenfolge der Scripts: `config.js` → `persistence.js` → `schemaStore.js` → `admin.js`.

### Schritt 5 – Tab "Einstellungen" implementieren
Formular mit allen `Config`-Optionen, Speichern/Reset-Buttons.
Dieser Tab kommt früh, damit alle weiteren Schritte die Konfiguration bereits nutzen können.

### Schritt 6 – Tab "Chemotherapie-Schemata" vollständig implementieren
Tabellen-Ansicht, Formular-Editor, Speichern/Laden via `SchemaStore`, Quellenangabe.

### Schritt 7 – Tabs "Support" und "G-CSF" implementieren
Analog zu Schritt 6 – Code kann weitgehend wiederverwendet werden.

### Schritt 8 – Tab "Import / Export" implementieren
Via `persistence.js` Funktionen `exportToFile` und `importFromFile`.

### Schritt 9 – Persistierung für Patientenpläne in `index.html`
"Speichern"-Button in `index.html` → UUID generieren → `Persistence.save()`.
Anzeige der gespeicherten UUID mit Copy-Button.

### Schritt 10 – `resolver.html` implementieren
UUID oder Base64-String → Plan rekonstruieren → Formular befüllen.

---

## Technische Constraints (unverändert beibehalten)

- Kein Build-Step, kein npm, kein Framework
- Alle Dateien als `<script src="...">` eingebunden – **Ladereihenfolge beachten:**
  `config.js` → `persistence.js` → `schemaStore.js` → modulspezifisches JS (app.js / admin.js)
- Keine externen Abhängigkeiten
- Funktioniert durch direktes Öffnen von `index.html` im Browser
- Electron-kompatibel: kein Code darf Browser-spezifische APIs voraussetzen,
  die Electron nicht unterstützt (praktisch: alles was hier funktioniert, funktioniert auch dort)

---

## Stil-Vorgaben für Admin-UI

- Visuell konsistent mit `index.html` / `main.css` (gleiche Farbpalette, gleiche Schrift)
- Eigene `admin.css` – kein Ändern von `main.css`
- Responsive ist nice-to-have, Priorität liegt auf Desktop (1280px+)
- Deutsche Sprache als Standard in der Admin-UI (i18n kann später ergänzt werden)