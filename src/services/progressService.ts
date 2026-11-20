import { average, isAtOrAboveCompetente, scoreToLevel } from "../domain/levels";
import type { CategoryScore, KnowledgeLevel, ReadinessSummary, Topic } from "../domain/types";
import { listCategories, listTopics } from "./catalogService";
import { apiGet } from "./http";
import type { ApiReadiness } from "./mappers";

/** Topics come from backend with current_* already applied — no localStorage progress. */
export async function getMergedTopics(): Promise<Topic[]> {
  return listTopics();
}

export async function getCategoryScores(): Promise<CategoryScore[]> {
  const [categories, topics] = await Promise.all([listCategories(), listTopics()]);
  return categories
    .map((category) => {
      const catTopics = topics.filter((t) => t.categoryId === category.id && t.currentLevel !== "N_A");
      const scores = catTopics
        .map((t) => t.currentScore)
        .filter((s): s is number => s !== null && s !== undefined);
      const score = scores.length ? Math.round(average(scores)) : null;
      const level: KnowledgeLevel =
        score === null ? catTopics[0]?.currentLevel ?? "N_A" : scoreToLevel(score);
      return { category, score, level, topics: catTopics };
    })
    .filter((c) => c.topics.length > 0);
}

export async function getReadinessSummary(): Promise<ReadinessSummary> {
  const [readiness, weakTopics] = await Promise.all([
    apiGet<ApiReadiness>("/api/v1/dashboard/readiness"),
    listTopics({ belowTargetOnly: true }),
  ]);
  const sorted = [...weakTopics].sort((a, b) => (a.currentScore ?? 0) - (b.currentScore ?? 0));
  return {
    priorityTotal: readiness.priorityTopicCount,
    priorityAtTarget: readiness.priorityAtOrAboveCompetente,
    priorityPct: Math.round(readiness.percentPriorityCompetente),
    belowTargetCount: readiness.topicsBelowCompetente,
    weakTopics: sorted.slice(0, 5),
  };
}

export function isAtOrAboveCompetenteLevel(level: KnowledgeLevel): boolean {
  return isAtOrAboveCompetente(level);
}
