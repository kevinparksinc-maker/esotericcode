import type { ReadingPayload } from "@shared/esoteric";

const ACTIVE_READING_KEY = "esotericcode.active-reading";

export function saveActiveReading(reading: ReadingPayload) {
  sessionStorage.setItem(ACTIVE_READING_KEY, JSON.stringify(reading));
}

export function loadActiveReading(): ReadingPayload | undefined {
  try {
    const stored = sessionStorage.getItem(ACTIVE_READING_KEY);
    return stored ? JSON.parse(stored) as ReadingPayload : undefined;
  } catch {
    return undefined;
  }
}
