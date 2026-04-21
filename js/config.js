(function () {

  const STORAGE_KEY = "therapyplanner_config";

  const DEFAULTS = {
    storage: {
      mode: "local",
      exportPath: "",
      autoSave: false,
    },
    ui: {
      language: "de-DE",
      theme: "light",
      clinicName: "",
    },
    print: {
      showLogo: false,
      defaultView: "table",
      showSourceReference: true,
    },
    admin: {
      allowCustomSchemas: true,
      requireSourceReference: false,
    },
  };

  function deepMerge(target, source) {
    const result = {};
    const keys = new Set([...Object.keys(target ?? {}), ...Object.keys(source ?? {})]);
    for (const key of keys) {
      const t = target?.[key];
      const s = source?.[key];
      const tIsObj = t !== null && typeof t === "object" && !Array.isArray(t);
      const sIsObj = s !== null && typeof s === "object" && !Array.isArray(s);
      if (tIsObj || sIsObj) {
        result[key] = deepMerge(tIsObj ? t : {}, sIsObj ? s : {});
      } else {
        result[key] = s !== undefined ? s : t;
      }
    }
    return result;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepMerge(DEFAULTS, {});
      return deepMerge(DEFAULTS, JSON.parse(raw));
    } catch {
      return deepMerge(DEFAULTS, {});
    }
  }

  function persist(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn("Config: Speichern fehlgeschlagen", e);
    }
  }

  let _config = load();

  function get(key) {
    return key.split(".").reduce((obj, part) => {
      return obj != null ? obj[part] : undefined;
    }, _config);
  }

  function set(key, value) {
    const parts = key.split(".");
    const last = parts.pop();
    const target = parts.reduce((obj, part) => {
      if (obj[part] == null || typeof obj[part] !== "object") obj[part] = {};
      return obj[part];
    }, _config);
    target[last] = value;
    persist(_config);
  }

  function getAll() {
    return deepMerge(_config, {});
  }

  function reset() {
    _config = deepMerge(DEFAULTS, {});
    persist(_config);
  }

  window.Config = { get, set, getAll, reset };

})();
