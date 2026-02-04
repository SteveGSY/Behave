// js/storage.js
const STORAGE_KEY = "behaviourEvents";

export async function initStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const events = raw ? JSON.parse(raw) : [];

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const state = {
    events,
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    }
  };

  return state;
}
