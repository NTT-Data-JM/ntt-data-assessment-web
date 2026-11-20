import type {
  AssessmentProfile,
  Category,
  KnowledgeLevel,
  Question,
  QuestionModeFilter,
  QuestionType,
  RoleBand,
  Topic,
  WeaknessItem,
  StrengthItem,
  DomainExperience,
} from "../domain/types";
import { apiGet } from "./http";
import {
  mapCategory,
  mapProfile,
  mapQuestion,
  mapTopic,
  type ApiBaseline,
  type ApiProfile,
  type ApiQuestion,
  type ApiTopic,
} from "./mappers";

export async function getProfile(): Promise<AssessmentProfile> {
  return mapProfile(await apiGet<ApiProfile>("/api/v1/profiles/active"));
}

export async function listCategories(): Promise<Category[]> {
  const rows = await apiGet<{ id: string; profileId: string; name: string }[]>("/api/v1/categories");
  return rows.map(mapCategory);
}

export async function listTopics(filters?: {
  categoryId?: string;
  roleBand?: RoleBand;
  priorityOnly?: boolean;
  belowTargetOnly?: boolean;
  coreOnly?: boolean;
  search?: string;
}): Promise<Topic[]> {
  const rows = await apiGet<ApiTopic[]>("/api/v1/topics", {
    categoryId: filters?.categoryId,
    roleBand: filters?.roleBand,
    priorityOnly: filters?.priorityOnly,
    belowTargetOnly: filters?.belowTargetOnly,
    coreOnly: filters?.coreOnly,
    search: filters?.search,
  });
  return rows.map(mapTopic);
}

export async function getTopic(topicId: string): Promise<Topic | undefined> {
  try {
    return mapTopic(await apiGet<ApiTopic>(`/api/v1/topics/${encodeURIComponent(topicId)}`));
  } catch {
    return undefined;
  }
}

export async function listQuestions(filters?: {
  topicId?: string;
  type?: QuestionType;
  depth?: KnowledgeLevel;
  roleBand?: RoleBand;
  activeOnly?: boolean;
  mode?: QuestionModeFilter;
}): Promise<Question[]> {
  const rows = await apiGet<ApiQuestion[]>("/api/v1/questions", {
    topicId: filters?.topicId,
    type: filters?.type,
    depth: filters?.depth && filters.depth !== "N_A" ? filters.depth : undefined,
    roleBand: filters?.roleBand,
    mode: filters?.mode,
    activeOnly: filters?.activeOnly,
  });
  return rows.map(mapQuestion);
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  try {
    return mapQuestion(await apiGet<ApiQuestion>(`/api/v1/questions/${encodeURIComponent(id)}`));
  } catch {
    return undefined;
  }
}

export async function getBaselineBundle(): Promise<{
  profile: AssessmentProfile;
  experiences: DomainExperience[];
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  priorityTopics: Topic[];
}> {
  const baseline = await apiGet<ApiBaseline>("/api/v1/baseline");
  return {
    profile: mapProfile(baseline.profile),
    experiences: baseline.experiences.map((e) => ({
      id: e.id,
      name: e.name,
      knowledgeResult: e.knowledgeResult,
    })),
    strengths: baseline.strengths.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
    })),
    weaknesses: baseline.weaknesses.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      relatedTopicIds: w.relatedTopicIds ?? undefined,
    })),
    priorityTopics: baseline.priorityTopics.map(mapTopic),
  };
}

export async function hasLeaderQuestions(): Promise<boolean> {
  const qs = await listQuestions({ roleBand: "LEADER", activeOnly: true });
  return qs.length > 0;
}
