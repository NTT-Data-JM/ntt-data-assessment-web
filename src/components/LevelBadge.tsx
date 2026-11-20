import { levelLabel } from "../domain/levels";
import type { KnowledgeLevel } from "../domain/types";

export function LevelBadge({ level }: { level: KnowledgeLevel }) {
  return <span className={`badge level-${level}`}>{levelLabel(level)}</span>;
}
