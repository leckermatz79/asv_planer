(function () {

  const NS = "therapyplanner_";
  const IDB_NAME = "therapyplanner_fs";
  const IDB_STORE = "handles";
  const DIR_KEY = "selectedDirectory";

  const hasFileSystemAccess = typeof window.showDirectoryPicker === "function";

  /* ─── IndexedDB-Hilfsfunktionen (nur für FileSystemDirectoryHandle) ─────────
     FileSystemDirectoryHandle lässt sich nicht in localStorage serialisieren,
     daher IndexedDB als Ablageort für den Ordner-Handle.               */

  function openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  }

  async function idbGet(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = e => resolve(e.target.result ?? null);
      req.onerror = e => reject(e.target.error);
    });
  }

  async function idbSet(key, value) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const req = tx.objectStore(IDB_STORE).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    });
  }

  async function idbDelete(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const req = tx.objectStore(IDB_STORE).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    });
  }

  /* ─── Ordner-Verwaltung ─────────────────────────────────────────────────── */

  async function getDirectoryHandle() {
    if (!hasFileSystemAccess) return null;
    const handle = await idbGet(DIR_KEY);
    if (!handle) return null;
    try {
      const perm = await handle.queryPermission({ mode: "readwrite" });
      if (perm === "granted") return handle;
      const req = await handle.requestPermission({ mode: "readwrite" });
      return req === "granted" ? handle : null;
    } catch {
      return null;
    }
  }

  async function selectDirectory() {
    if (!hasFileSystemAccess) return false;
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await idbSet(DIR_KEY, handle);
      return true;
    } catch {
      return false; // Nutzer hat abgebrochen
    }
  }

  async function clearDirectory() {
    await idbDelete(DIR_KEY);
  }

  async function getDirectoryInfo() {
    if (!hasFileSystemAccess) return null;
    const handle = await idbGet(DIR_KEY);
    if (!handle) return null;
    return { name: handle.name };
  }

  /* ─── localStorage (save / load / remove / list) ────────────────────────── */

  function save(key, data) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(data));
    } catch (e) {
      console.warn("Persistence.save fehlgeschlagen:", e);
    }
  }

  function load(key) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function remove(key) {
    localStorage.removeItem(NS + key);
  }

  function list(prefix = "") {
    const full = NS + prefix;
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(full)) results.push(k.slice(NS.length));
    }
    return results;
  }

  /* ─── Datei-Export / -Import ─────────────────────────────────────────────── */

  async function exportToFile(filename, data) {
    const json = JSON.stringify(data, null, 2);
    const handle = await getDirectoryHandle();
    if (handle) {
      try {
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      } catch (e) {
        console.warn("Persistence.exportToFile: Direktschreiben fehlgeschlagen, fallback auf Download", e);
      }
    }
    // Fallback: Browser-Download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch {
          reject(new Error("Ungültiges JSON"));
        }
      };
      reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
      reader.readAsText(file);
    });
  }

  async function openFromDirectory(filename) {
    const handle = await getDirectoryHandle();
    if (!handle) return null;
    try {
      const fileHandle = await handle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return JSON.parse(await file.text());
    } catch {
      return null;
    }
  }

  /* ─── String-Kodierung (für KIS-Integration) ─────────────────────────────── */

  function encodeToString(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = "";
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  function decodeFromString(str) {
    try {
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }

  /* ─── Öffentliche API ────────────────────────────────────────────────────── */

  window.Persistence = {
    // localStorage
    save,
    load,
    remove,
    list,
    // Ordner-Verwaltung (File System Access API)
    hasFileSystemAccess,
    selectDirectory,
    clearDirectory,
    getDirectoryInfo,
    // Datei-Export/-Import
    exportToFile,
    importFromFile,
    openFromDirectory,
    // String-Kodierung
    encodeToString,
    decodeFromString,
  };

})();
