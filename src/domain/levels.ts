import type { KnowledgeLevel } from "./types";

const ORDER: Record<KnowledgeLevel, number> = {
  N_A: -1,
  NOVATO: 1,
  PRINCIPIANTE_AVANZADO: 2,
  COMPETENTE: 3,
  PROFICIENTE: 4,
  MASTER: 5,
};

export const KNOWLEDGE_LEVELS: Exclude<KnowledgeLevel, "N_A">[] = [
  "NOVATO",
  "PRINCIPIANTE_AVANZADO",
  "COMPETENTE",
  "PROFICIENTE",
  "MASTER",
];

export function levelOrder(level: KnowledgeLevel): number {
  return ORDER[level] ?? -1;
}

export function scoreToLevel(score: number): KnowledgeLevel {
  if (score < 40) return "NOVATO";
  if (score < 60) return "PRINCIPIANTE_AVANZADO";
  if (score < 80) return "COMPETENTE";
  if (score < 90) return "PROFICIENTE";
  return "MASTER";
}

export function isAtOrAboveCompetente(level: KnowledgeLevel): boolean {
  return levelOrder(level) >= levelOrder("COMPETENTE");
}

export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

export function levelLabel(level: KnowledgeLevel): string {
  switch (level) {
    case "PRINCIPIANTE_AVANZADO":
      return "Principiante Avanzado";
    case "N_A":
      return "N/A";
    default:
      return level.charAt(0) + level.slice(1).toLowerCase();
  }
}

export function roleBandLabel(band: string): string {
  switch (band) {
    case "JUNIOR":
      return "Junior";
    case "MID":
      return "Mid";
    case "SENIOR":
      return "Senior";
    case "LEADER":
      return "Leader";
    default:
      return band;
  }
}

export function gapStatus(
  level: KnowledgeLevel,
): "below" | "at" | "above" | "na" {
  if (level === "N_A") return "na";
  const order = levelOrder(level);
  const target = levelOrder("COMPETENTE");
  if (order < target) return "below";
  if (order === target) return "at";
  return "above";
}
