import type { QuestionModeFilter, QuizAttempt, RoleBand } from "../domain/types";
import { apiGet } from "./http";
import { mapAttempt, type ApiAttempt } from "./mappers";

export async function listAttempts(filters?: {
  roleBand?: RoleBand;
  topicId?: string;
  mode?: QuestionModeFilter;
  status?: string;
  from?: string;
  to?: string;
}): Promise<QuizAttempt[]> {
  const rows = await apiGet<ApiAttempt[]>("/api/v1/history/attempts", {
    status: filters?.status,
    roleBand: filters?.roleBand,
  });
  let result = rows.map(mapAttempt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filters?.mode) result = result.filter((a) => a.setup.questionMode === filters.mode);
  if (filters?.topicId) {
    result = result.filter((a) => a.resolvedTopicIds.includes(filters.topicId!));
  }
  if (filters?.from) result = result.filter((a) => a.createdAt >= filters.from!);
  if (filters?.to) result = result.filter((a) => a.createdAt <= filters.to!);
  return result;
}

export async function getAttempt(attemptId: string): Promise<QuizAttempt | undefined> {
  try {
    return mapAttempt(
      await apiGet<ApiAttempt>(`/api/v1/history/attempts/${encodeURIComponent(attemptId)}`),
    );
  } catch {
    try {
      return mapAttempt(
        await apiGet<ApiAttempt>(`/api/v1/quizzes/attempts/${encodeURIComponent(attemptId)}`),
      );
    } catch {
      return undefined;
    }
  }
}

export async function topicTrend(
  topicId: string,
  limit = 3,
): Promise<{ attemptId: string; score: number; date: string }[]> {
  const attempts = await listAttempts({ topicId });
  return attempts
    .filter((a) => a.status === "COMPLETED" && a.topicScores?.[topicId] !== undefined)
    .slice(0, limit)
    .map((a) => ({
      attemptId: a.id,
      score: a.topicScores![topicId],
      date: a.completedAt ?? a.createdAt,
    }));
}
