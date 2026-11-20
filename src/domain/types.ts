export type KnowledgeLevel =
  | "NOVATO"
  | "PRINCIPIANTE_AVANZADO"
  | "COMPETENTE"
  | "PROFICIENTE"
  | "MASTER"
  | "N_A";

export type RoleBand = "JUNIOR" | "MID" | "SENIOR" | "LEADER";

export type Relevance = "CORE" | "RELEVANTE" | "COMPLEMENTARIA";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT";

export type QuestionModeFilter = "CHOICE" | "TEXT" | "BOTH";

export type DepthFocus =
  | { kind: "EXACT"; depths: KnowledgeLevel[] }
  | { kind: "RECOMMENDED" };

export type AttemptStatus = "IN_PROGRESS" | "COMPLETED";

export interface AssessmentProfile {
  id: string;
  name: string;
  roleFamily: string;
  technology: string;
  candidateName: string;
  evaluationDate: string;
  baselineSeniority: KnowledgeLevel;
  targetKnowledge: KnowledgeLevel;
}

export interface DomainExperience {
  id: string;
  name: string;
  knowledgeResult: string;
}

export interface StrengthItem {
  id: string;
  title: string;
  description: string;
}

export interface WeaknessItem {
  id: string;
  title: string;
  description: string;
  relatedTopicIds?: string[];
}

export interface Category {
  id: string;
  profileId: string;
  name: string;
}

export interface Topic {
  id: string;
  profileId: string;
  categoryId: string;
  name: string;
  roleBand: RoleBand;
  relevanceByLevel: Partial<Record<Exclude<KnowledgeLevel, "N_A">, Relevance>>;
  baselineLevel: KnowledgeLevel;
  currentScore: number | null;
  currentLevel: KnowledgeLevel;
  priorityToLevel: boolean;
  baselineNotes: string;
  generatedNotes?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  topicId: string;
  type: QuestionType;
  prompt: string;
  knowledgeDepth: Exclude<KnowledgeLevel, "N_A">;
  roleBands: RoleBand[];
  active: boolean;
  options?: ChoiceOption[];
  referenceAnswer?: string;
  keywords?: string[];
  explanation: string;
}

export interface QuizSetupInput {
  profileId: string;
  roleBand: RoleBand;
  depthFocus: DepthFocus;
  questionMode: QuestionModeFilter;
  selectedTopicIds: string[];
}

export type AnswerValue =
  | { type: "SINGLE_CHOICE"; optionId: string | null }
  | { type: "MULTIPLE_CHOICE"; optionIds: string[] }
  | { type: "TEXT"; text: string };

export interface QuizAttempt {
  id: string;
  profileId: string;
  createdAt: string;
  completedAt?: string;
  status: AttemptStatus;
  setup: QuizSetupInput;
  resolvedTopicIds: string[];
  questionIds: string[];
  substitutionsNote?: string;
  answers: Record<string, AnswerValue>;
  questionScores?: Record<string, number>;
  topicScores?: Record<string, number>;
  generalScore?: number;
  generalLevel?: KnowledgeLevel;
  topicNotes?: Record<string, string>;
  overallNotes?: string;
}

export interface TopicProgress {
  currentScore: number | null;
  currentLevel: KnowledgeLevel;
  generatedNotes?: string;
}

export interface GenerationPreview {
  topicIds: string[];
  questionIds: string[];
  questionsPerTopic: number;
  totalQuestions: number;
  warnings: string[];
  substitutionsNote?: string;
  valid: boolean;
}

export interface ReadinessSummary {
  priorityTotal: number;
  priorityAtTarget: number;
  priorityPct: number;
  belowTargetCount: number;
  weakTopics: Topic[];
}

export interface CategoryScore {
  category: Category;
  score: number | null;
  level: KnowledgeLevel;
  topics: Topic[];
}
