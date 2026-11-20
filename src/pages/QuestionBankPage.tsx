import { useState } from "react";
import { levelLabel, roleBandLabel } from "../domain/levels";
import type { KnowledgeLevel, QuestionType, RoleBand } from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { listCategories, listQuestions, listTopics } from "../services/catalogService";
import { useDemoStore } from "../state/DemoStore";

export function QuestionBankPage() {
  const { revision } = useDemoStore();
  const [categoryId, setCategoryId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState<QuestionType | "">("");
  const [depth, setDepth] = useState<KnowledgeLevel | "">("");
  const [roleBand, setRoleBand] = useState<RoleBand | "">("");

  const { data, loading, error } = useAsync(async () => {
    const [categories, topics, questions] = await Promise.all([
      listCategories(),
      listTopics({ categoryId: categoryId || undefined }),
      listQuestions({
        topicId: topicId || undefined,
        type: type || undefined,
        depth: depth || undefined,
        roleBand: roleBand || undefined,
        activeOnly: true,
      }),
    ]);
    const topicIds = new Set(topics.map((t) => t.id));
    const filtered =
      categoryId && !topicId ? questions.filter((q) => topicIds.has(q.topicId)) : questions;
    const allTopics = await listTopics();
    const topicName = Object.fromEntries(allTopics.map((t) => [t.id, t.name]));
    return { categories, topics, questions: filtered, topicName };
  }, [categoryId, topicId, type, depth, roleBand, revision]);

  return (
    <div className="stack">
      <section className="card">
        <h2>Question bank (read-only)</h2>
        <div className="filters">
          <label>
            Categoría
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setTopicId("");
              }}
            >
              <option value="">Todas</option>
              {(data?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tema
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">Todos</option>
              {(data?.topics ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value as QuestionType | "")}>
              <option value="">Todos</option>
              <option value="SINGLE_CHOICE">Single</option>
              <option value="MULTIPLE_CHOICE">Multiple</option>
              <option value="TEXT">Text</option>
            </select>
          </label>
          <label>
            Depth
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as KnowledgeLevel | "")}
            >
              <option value="">Todos</option>
              <option value="NOVATO">Novato</option>
              <option value="PRINCIPIANTE_AVANZADO">PA</option>
              <option value="COMPETENTE">Competente</option>
              <option value="PROFICIENTE">Proficiente</option>
            </select>
          </label>
          <label>
            Role band
            <select
              value={roleBand}
              onChange={(e) => setRoleBand(e.target.value as RoleBand | "")}
            >
              <option value="">Todas</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
          </label>
        </div>
      </section>

      {loading && <p className="muted">Cargando preguntas…</p>}
      {error && <div className="empty">Error: {error}</div>}

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Tema</th>
              <th>Tipo</th>
              <th>Depth</th>
              <th>Bands</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            {(data?.questions ?? []).map((q) => (
              <tr key={q.id}>
                <td>{data?.topicName[q.topicId] ?? q.topicId}</td>
                <td>{q.type}</td>
                <td>{levelLabel(q.knowledgeDepth)}</td>
                <td>{q.roleBands.map(roleBandLabel).join(", ")}</td>
                <td>
                  {q.prompt.slice(0, 90)}
                  {q.prompt.length > 90 ? "…" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data && !data.questions.length && (
          <div className="empty">Sin preguntas para estos filtros.</div>
        )}
      </section>
    </div>
  );
}
