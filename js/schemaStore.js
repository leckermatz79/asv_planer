(function () {

  const STORAGE_KEYS = {
    chemo:   "custom_chemo",
    support: "custom_support",
    gcsf:    "custom_gcsf",
  };

  const BUILTIN = {
    chemo:   () => window.CHEMO_SCHEMAS   || {},
    support: () => window.SUPPORT_SCHEMAS || {},
    gcsf:    () => window.GCSF_SCHEMAS    || {},
  };

  /* ─── Interner Lade-/Speicher-Zugriff ────────────────────────────────────── */

  function loadCustom(type) {
    return Persistence.load(STORAGE_KEYS[type]) || {};
  }

  function persistCustom(type, data) {
    Persistence.save(STORAGE_KEYS[type], data);
  }

  /* ─── Merge: Built-in + Custom ───────────────────────────────────────────── */

  function getMerged(type) {
    const builtin = BUILTIN[type]();
    const custom  = loadCustom(type);
    const result  = {};

    for (const [id, schema] of Object.entries(builtin)) {
      result[id] = { ...schema, _isCustom: false };
    }

    // Custom-Einträge überschreiben Built-ins bei gleichem Key
    for (const [id, schema] of Object.entries(custom)) {
      result[id] = { ...schema, _isCustom: true };
    }

    return result;
  }

  /* ─── ID-Generierung für neue custom Schemata ────────────────────────────── */

  function generateId(label) {
    const sanitized = (label || "schema")
      .toLowerCase()
      .replace(/[äöü]/g, c => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
    return "custom_" + sanitized + "_" + Date.now();
  }

  /* ─── Öffentliche API ────────────────────────────────────────────────────── */

  function getChemoSchemas()   { return getMerged("chemo");   }
  function getSupportSchemas() { return getMerged("support"); }
  function getGcsfSchemas()    { return getMerged("gcsf");    }

  function saveCustomSchema(type, schema) {
    if (!STORAGE_KEYS[type]) throw new Error("Unbekannter Schema-Typ: " + type);
    const all = loadCustom(type);
    const id  = schema._id || generateId(schema.label);
    const toStore = { ...schema, _isCustom: true };
    delete toStore._id; // _id gehört nicht in den gespeicherten Datensatz
    all[id] = toStore;
    persistCustom(type, all);
    return id;
  }

  function deleteCustomSchema(type, id) {
    if (!STORAGE_KEYS[type]) throw new Error("Unbekannter Schema-Typ: " + type);
    const all = loadCustom(type);
    if (!all[id]) return false;
    delete all[id];
    persistCustom(type, all);
    return true;
  }

  function exportAllCustom() {
    return {
      chemo:   loadCustom("chemo"),
      support: loadCustom("support"),
      gcsf:    loadCustom("gcsf"),
    };
  }

  // Importiert custom Schemata – bei Key-Konflikten wird der vorhandene Eintrag behalten.
  function importCustom(json) {
    let imported = 0;
    for (const type of Object.keys(STORAGE_KEYS)) {
      if (!json[type]) continue;
      const existing = loadCustom(type);
      for (const [id, schema] of Object.entries(json[type])) {
        if (existing[id]) continue;
        existing[id] = { ...schema, _isCustom: true };
        imported++;
      }
      persistCustom(type, existing);
    }
    return imported;
  }

  function resetAllCustom() {
    for (const type of Object.keys(STORAGE_KEYS)) {
      persistCustom(type, {});
    }
  }

  window.SchemaStore = {
    getChemoSchemas,
    getSupportSchemas,
    getGcsfSchemas,
    saveCustomSchema,
    deleteCustomSchema,
    exportAllCustom,
    importCustom,
    resetAllCustom,
  };

})();
