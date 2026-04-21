# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fully offline, browser-based tool for generating oncological chemotherapy therapy plans. No build step, no server, no dependencies — open `index.html` directly in a browser.

## Running the App

```bash
open index.html          # macOS
# or serve locally:
python3 -m http.server 8080
```

There is no build, lint, or test command. All testing is manual in the browser.

## Architecture

The app is a single-page HTML tool with no framework. Files are loaded as `<script src="...">` tags in `index.html`:

1. **`js/chemoSchemas.js`** — Defines 40+ chemotherapy regimens as `window.chemoSchemas`. Each schema has a `label`, `cycleDays`, `numCycles`, and an array of `events` (type `"therapy"` or `"lab"`, with optional `fasting` and `workdays_before_next_cycle_start` flags).

2. **`js/supportSchemas.js`** — Defines `window.supportSchemas`: per-day supportive medication plans (antiemetics, etc.).

3. **`js/gcsfSchemas.js`** — Defines `window.gcsfSchemas`: G-CSF agents (Pegfilgrastim, Filgrastim, etc.) with their application day and duration.

4. **`js/i18n.js`** — Internationalization. Exports `t(key, ...params)` for all user-facing strings. Language stored in `localStorage` under key `therapyplanner_lang`. Supports 6 locales: `de-DE`, `en-GB`, `tr-TR`, `pl-PL`, `ru-RU`, `uk-UA`.

5. **`js/app.js`** — All application logic (~1063 lines):
   - `init()` populates dropdowns from schemas, registers event listeners, and restores saved language.
   - `submitHandler()` reads the form and calls `buildAndStoreStateFromDOM()` then `renderAll()`.
   - `buildCycles(startDate, schema)` is the core engine: calculates all treatment days, lab dates (counting back workdays, skipping weekends and NRW public holidays), G-CSF injections, and follow-up cycles.
   - `renderAll()` produces the patient header, graphic timeline (one reference cycle), full tabular schedule, drug color legend, and support medication plan.
   - Print is handled by `printGraphic()`, `printTable()`, `printSupport()` which toggle CSS classes — no JS filtering needed.

6. **`css/main.css`** — Single stylesheet. Uses CSS Grid for the 3-column form layout. Print-specific media queries handle landscape (graphic) vs. portrait (table) output. Drug color coding uses CSS custom properties.

## Key Domain Concepts

- **Events** in schemas are either `"therapy"` (a drug infusion on a fixed day) or `"lab"` (blood draw, optionally fasting). Lab dates can be specified as `workdays_before_next_cycle_start: N` to count backwards from the next cycle start, skipping weekends/holidays.
- **Public holidays** are calculated for NRW (Germany) including Easter-dependent holidays. See `isHoliday()` in `app.js`.
- **G-CSF** injections are added on top of the chemo schema, starting on a configurable day (d2 or d3).
- **AppState** holds the currently selected schemas and the last rendered output for change detection. No reactive framework — re-render is triggered explicitly.
- `data-i18n="key"` attributes on HTML elements are translated after page load by `applyTranslations()`.

## Adding New Schemas

To add a new chemotherapy regimen, add an entry to the array in `js/chemoSchemas.js` following the existing pattern. The schema is automatically picked up by the dropdown on next page load. Same pattern for `supportSchemas.js` and `gcsfSchemas.js`.
