import type {
  AnswerValue,
  AssessmentProfile,
  Category,
  GenerationPreview,
  KnowledgeLevel,
  Question,
  QuizAttempt,
  QuizSetupInput,
  RoleBand,
  Topic,
} from "../domain/types";

export interface ApiProfile {
  id: string;
  name: string;
  roleFamily: string;
  technology: string;
  candidateName: string;
  evaluationDate: string;
  baselineSeniority: KnowledgeLevel;
  targetKnowledge: KnowledgeLevel;
}

export interface ApiTopic {
  id: string;
  profileId: string;
  categoryId: string;
  name: string;
  roleBand: RoleBand;
  relevanceByLevel: Partial<Record<Exclude<KnowledgeLevel, "N_A">, string>>;
  baselineLevel: KnowledgeLevel;
  currentScore: number | null;
  currentLevel: KnowledgeLevel;
  priorityToLevel: boolean;
  baselineNotes: string;
  generatedNotes?: string | null;
}

export interface ApiQuestion {
  id: string;
  topicId: string;
  type: Question["type"];
  prompt: string;
  knowledgeDepth: Exclude<KnowledgeLevel, "N_A">;
  roleBands: RoleBand[];
  active: boolean;
  options?: { id: string; label: string; isCorrect: boolean }[];
  referenceAnswer?: string | null;
  keywords?: string[] | null;
  explanation: string;
}

export interface ApiSaveAnswer {
  type: string;
  optionId?: string | null;
  optionIds?: string[] | null;
  text?: string | null;
}

export interface ApiAttempt {
  id: string;
  profileId: string;
  createdAt: string;
  completedAt?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  setup: {
    profileId: string;
    roleBand: RoleBand;
    depthFocus: { kind: string; depths?: KnowledgeLevel[] | null };
    questionMode: QuizSetupInput["questionMode"];
    selectedTopicIds?: string[] | null;
  };
  resolvedTopicIds: string[];
  questionIds: string[];
  substitutionsNote?: string | null;
  answers?: Record<string, ApiSaveAnswer> | null;
  questionScores?: Record<string, number> | null;
  topicScores?: Record<string, number> | null;
  generalScore?: number | null;
  generalLevel?: KnowledgeLevel | null;
  topicNotes?: Record<string, string> | null;
  overallNotes?: string | null;
}

export interface ApiPreview {
  topicIds: string[];
  questionIds: string[];
  questionsPerTopic: number;
  totalQuestions: number;
  warnings: string[];
  substitutionsNote?: string | null;
  valid: boolean;
}

export interface ApiBaseline {
  profile: ApiProfile;
  experiences: { id: string; name: string; knowledgeResult: string }[];
  strengths: { id: string; title: string; description: string }[];
  weaknesses: {
    id: string;
    title: string;
    description: string;
    relatedTopicIds?: string[] | null;
  }[];
  priorityTopics: ApiTopic[];
}

export interface ApiReadiness {
  priorityTopicCount: number;
  priorityAtOrAboveCompetente: number;
  percentPriorityCompetente: number;
  topicsBelowCompetente: number;
}

export function mapProfile(p: ApiProfile): AssessmentProfile {
  return {
    id: p.id,
    name: p.name,
    roleFamily: p.roleFamily,
    technology: p.technology,
    candidateName: p.candidateName,
    evaluationDate: p.evaluationDate,
    baselineSeniority: p.baselineSeniority,
    targetKnowledge: p.targetKnowledge,
  };
}

export function mapCategory(c: { id: string; profileId: string; name: string }): Category {
  return { id: c.id, profileId: c.profileId, name: c.name };
}

export function mapTopic(t: ApiTopic): Topic {
  return {
    id: t.id,
    profileId: t.profileId,
    categoryId: t.categoryId,
    name: t.name,
    roleBand: t.roleBand,
    relevanceByLevel: t.relevanceByLevel as Topic["relevanceByLevel"],
    baselineLevel: t.baselineLevel,
    currentScore: t.currentScore,
    currentLevel: t.currentLevel,
    priorityToLevel: t.priorityToLevel,
    baselineNotes: t.baselineNotes,
    generatedNotes: t.generatedNotes ?? undefined,
  };
}

export function mapQuestion(q: ApiQuestion): Question {
  return {
    id: q.id,
    topicId: q.topicId,
    type: q.type,
    prompt: q.prompt,
    knowledgeDepth: q.knowledgeDepth,
    roleBands: q.roleBands ?? [],
    active: q.active,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      isCorrect: o.isCorrect,
    })),
    referenceAnswer: q.referenceAnswer ?? undefined,
    keywords: q.keywords ?? undefined,
    explanation: q.explanation,
  };
}

export function mapAnswerFromApi(a: ApiSaveAnswer): AnswerValue {
  if (a.type === "MULTIPLE_CHOICE") {
    return { type: "MULTIPLE_CHOICE", optionIds: a.optionIds ?? [] };
  }
  if (a.type === "TEXT") {
    return { type: "TEXT", text: a.text ?? "" };
  }
  return { type: "SINGLE_CHOICE", optionId: a.optionId ?? null };
}

export function mapAnswerToApi(answer: AnswerValue): ApiSaveAnswer {
  if (answer.type === "MULTIPLE_CHOICE") {
    return { type: "MULTIPLE_CHOICE", optionId: null, optionIds: answer.optionIds, text: null };
  }
  if (answer.type === "TEXT") {
    return { type: "TEXT", optionId: null, optionIds: null, text: answer.text };
  }
  return { type: "SINGLE_CHOICE", optionId: answer.optionId, optionIds: null, text: null };
}

export function mapAttempt(a: ApiAttempt): QuizAttempt {
  const answers: Record<string, AnswerValue> = {};
  for (const [qid, ans] of Object.entries(a.answers ?? {})) {
    answers[qid] = mapAnswerFromApi(ans);
  }
  const depthFocus =
    a.setup.depthFocus.kind === "EXACT"
      ? { kind: "EXACT" as const, depths: (a.setup.depthFocus.depths ?? []).filter((d) => d !== "N_A") }
      : { kind: "RECOMMENDED" as const };

  return {
    id: a.id,
    profileId: a.profileId,
    createdAt: a.createdAt,
    completedAt: a.completedAt ?? undefined,
    status: a.status,
    setup: {
      profileId: a.setup.profileId,
      roleBand: a.setup.roleBand,
      depthFocus,
      questionMode: a.setup.questionMode,
      selectedTopicIds: a.setup.selectedTopicIds ?? [],
    },
    resolvedTopicIds: a.resolvedTopicIds ?? [],
    questionIds: a.questionIds ?? [],
    substitutionsNote: a.substitutionsNote ?? undefined,
    answers,
    questionScores: a.questionScores ?? undefined,
    topicScores: a.topicScores ?? undefined,
    generalScore: a.generalScore ?? undefined,
    generalLevel: a.generalLevel ?? undefined,
    topicNotes: a.topicNotes ?? undefined,
    overallNotes: a.overallNotes ?? undefined,
  };
}

export function mapPreview(p: ApiPreview): GenerationPreview {
  return {
    topicIds: p.topicIds ?? [],
    questionIds: p.questionIds ?? [],
    questionsPerTopic: p.questionsPerTopic,
    totalQuestions: p.totalQuestions,
    warnings: p.warnings ?? [],
    substitutionsNote: p.substitutionsNote ?? undefined,
    valid: p.valid,
  };
}

export function mapSetupToApi(setup: QuizSetupInput) {
  return {
    profileId: setup.profileId,
    roleBand: setup.roleBand,
    questionMode: setup.questionMode,
    selectedTopicIds: setup.selectedTopicIds,
    depthFocus:
      setup.depthFocus.kind === "EXACT"
        ? { kind: "EXACT", depths: setup.depthFocus.depths }
        : { kind: "RECOMMENDED", depths: [] },
  };
}
