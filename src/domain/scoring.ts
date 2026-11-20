import { average, scoreToLevel } from "./levels";
import type { AnswerValue, KnowledgeLevel, Question, QuizAttempt } from "./types";

export function scoreQuestion(question: Question, answer?: AnswerValue): number {
  if (!answer) return 0;

  if (question.type === "SINGLE_CHOICE" && answer.type === "SINGLE_CHOICE") {
    if (!answer.optionId) return 0;
    const option = question.options?.find((o) => o.id === answer.optionId);
    return option?.isCorrect ? 100 : 0;
  }

  if (question.type === "MULTIPLE_CHOICE" && answer.type === "MULTIPLE_CHOICE") {
    const correct = new Set(
      (question.options ?? []).filter((o) => o.isCorrect).map((o) => o.id),
    );
    const selected = new Set(answer.optionIds);
    if (correct.size !== selected.size) return 0;
    for (const id of correct) {
      if (!selected.has(id)) return 0;
    }
    return 100;
  }

  if (question.type === "TEXT" && answer.type === "TEXT") {
    const keywords = question.keywords ?? [];
    if (keywords.length === 0) return 0;
    const normalized = answer.text.toLowerCase().trim();
    if (!normalized) return 0;
    const hits = keywords.filter((k) => normalized.includes(k.toLowerCase())).length;
    return Math.round((100 * hits) / keywords.length);
  }

  return 0;
}

export function buildTopicNotes(
  topicId: string,
  questions: Question[],
  scores: Record<string, number>,
): string {
  const topicQuestions = questions.filter((q) => q.topicId === topicId);
  const missed = topicQuestions.filter((q) => (scores[q.id] ?? 0) < 60);
  const good = topicQuestions.filter((q) => (scores[q.id] ?? 0) >= 60);

  const parts: string[] = [];
  if (good.length) {
    parts.push(`Correctas/parciales: ${good.map((q) => q.prompt.slice(0, 48)).join("; ")}.`);
  }
  if (missed.length) {
    parts.push(
      `A reforzar: ${missed.map((q) => q.prompt.slice(0, 48)).join("; ")}. Revisa explicación y keywords del tema.`,
    );
  }
  if (!parts.length) parts.push("Sin respuestas evaluadas para este tema.");
  return parts.join(" ");
}

export function scoreAttempt(
  attempt: QuizAttempt,
  questions: Question[],
): Pick<
  QuizAttempt,
  | "questionScores"
  | "topicScores"
  | "generalScore"
  | "generalLevel"
  | "topicNotes"
  | "overallNotes"
> {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const questionScores: Record<string, number> = {};
  const topicBuckets: Record<string, number[]> = {};

  for (const qid of attempt.questionIds) {
    const q = byId.get(qid);
    if (!q) continue;
    const score = scoreQuestion(q, attempt.answers[qid]);
    questionScores[qid] = score;
    (topicBuckets[q.topicId] ??= []).push(score);
  }

  const topicScores: Record<string, number> = {};
  const topicNotes: Record<string, string> = {};
  for (const [topicId, scores] of Object.entries(topicBuckets)) {
    topicScores[topicId] = Math.round(average(scores));
    topicNotes[topicId] = buildTopicNotes(topicId, questions, questionScores);
  }

  const allScores = Object.values(questionScores);
  const generalScore = Math.round(average(allScores));
  const generalLevel: KnowledgeLevel = scoreToLevel(generalScore);

  const weakTopics = Object.entries(topicScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([id, score]) => `${id} (${score})`);

  const overallNotes = weakTopics.length
    ? `Foco sugerido tras este intento: ${weakTopics.join(", ")}.`
    : "Intento sin debilidades destacadas.";

  return {
    questionScores,
    topicScores,
    generalScore,
    generalLevel,
    topicNotes,
    overallNotes,
  };
}
