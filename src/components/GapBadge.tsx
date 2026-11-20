import { gapStatus } from "../domain/levels";
import type { KnowledgeLevel } from "../domain/types";

export function GapBadge({ level }: { level: KnowledgeLevel }) {
  const status = gapStatus(level);
  const label =
    status === "below"
      ? "Bajo COMPETENTE"
      : status === "at"
        ? "En COMPETENTE"
        : status === "above"
          ? "Sobre COMPETENTE"
          : "N/A";
  return <span className={`badge gap-${status === "na" ? "below" : status}`}>{label}</span>;
}
