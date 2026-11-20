import type { AnswerValue, GenerationPreview, QuizAttempt, QuizSetupInput } from "../domain/types";
import { apiGet, apiSend } from "./http";
import {
  mapAnswerToApi,
  mapAttempt,
  mapPreview,
  mapSetupToApi,
  type ApiAttempt,
  type ApiPreview,
} from "./mappers";

export async function previewGeneration(setup: QuizSetupInput): Promise<GenerationPreview> {
  return mapPreview(
    await apiSend<ApiPreview>("POST", "/api/v1/quizzes/preview", mapSetupToApi(setup)),
  );
}

export async function createAttempt(setup: QuizSetupInput): Promise<QuizAttempt> {
  return mapAttempt(
    await apiSend<ApiAttempt>("POST", "/api/v1/quizzes/attempts", mapSetupToApi(setup)),
  );
}

export async function getQuizAttempt(attemptId: string): Promise<QuizAttempt | undefined> {
  try {
    return mapAttempt(
      await apiGet<ApiAttempt>(`/api/v1/quizzes/attempts/${encodeURIComponent(attemptId)}`),
    );
  } catch {
    return undefined;
  }
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  answer: AnswerValue,
): Promise<QuizAttempt> {
  return mapAttempt(
    await apiSend<ApiAttempt>(
      "PUT",
      `/api/v1/quizzes/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`,
      mapAnswerToApi(answer),
    ),
  );
}

export async function submitAttempt(
  attemptId: string,
  allowIncomplete = true,
  useAiTextGrading = false,
): Promise<QuizAttempt> {
  return mapAttempt(
    await apiSend<ApiAttempt>(
      "POST",
      `/api/v1/quizzes/attempts/${encodeURIComponent(attemptId)}/submit`,
      { allowIncomplete, useAiTextGrading },
    ),
  );
}
