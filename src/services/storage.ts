import type { RoleBand } from "../domain/types";

const PREFIX = "ntt-assessment-web:v2:";

export const STORAGE_KEYS = {
  roleBand: `${PREFIX}roleBand`,
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredRoleBand(): RoleBand | null {
  return readJson<RoleBand>(STORAGE_KEYS.roleBand);
}

export function setStoredRoleBand(band: RoleBand): void {
  writeJson(STORAGE_KEYS.roleBand, band);
}
