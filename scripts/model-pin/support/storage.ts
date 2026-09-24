/**
 * A Map-backed `localStorage` for node, installed before any store module
 * loads, so the persisted chat prefs can be read back as a browser would.
 */
const data = new Map<string, string>();

(globalThis as { localStorage?: Storage }).localStorage = {
  get length() {
    return data.size;
  },
  clear: () => data.clear(),
  getItem: (key: string) => data.get(key) ?? null,
  key: (index: number) => [...data.keys()][index] ?? null,
  removeItem: (key: string) => void data.delete(key),
  setItem: (key: string, value: string) => void data.set(key, String(value)),
};

export {};
