import { Link, useParams } from "react-router-dom";
import { LevelBadge } from "../components/LevelBadge";
import { ScoreBar } from "../components/ScoreBar";
import { roleBandLabel } from "../domain/levels";
import type { Question } from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { getQuestionById, getTopic } from "../services/catalogService";
import { getAttempt } from "../services/historyService";
import { useDemoStore } from "../state/DemoStore";

export function AttemptDetailPage() {
  const { attemptId = "" } = useParams();
  const { revision } = useDemoStore();
  const { data, loading, error } = useAsync(async () => {
    const attempt = await getAttempt(attemptId);
    if (!attempt) return null;
    const questions = (
      await Promise.all(attempt.questionIds.map((id) => getQuestionById(id)))
    ).filter((q): q is Question => Boolean(q));
    const topics = await Promise.all(
      attempt.resolvedTopicIds.map(async (id) => ({
        id,
        name: (await getTopic(id))?.name ?? id,
      })),
    );
    return { attempt, questions, topics };
  }, [attemptId, revision]);

  if (loading) return <p className="muted">Cargando intento…</p>;
  if (error) return <div className="empty">Error: {error}</div>;
  if (!data?.attempt) return <div className="empty">Intento no encontrado.</div>;

  const { attempt, questions, topics } = data;
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const topicName = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return (
    <div className="stack">
      <section className="card">
        <h2>Detalle de intento</h2>
        <p className="muted">
          {new Date(attempt.createdAt).toLocaleString()} · {roleBandLabel(attempt.setup.roleBand)} ·{" "}
          {attempt.setup.questionMode} · {attempt.status}
        </p>
        {attempt.status === "COMPLETED" && (
          <div className="row">
            <LevelBadge level={attempt.generalLevel ?? "N_A"} />
            <ScoreBar score={attempt.generalScore ?? null} />
          </div>
        )}
        <p className="muted">{attempt.overallNotes}</p>
        {attempt.substitutionsNote && <div className="warn-box">{attempt.substitutionsNote}</div>}
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <Link to="/history">
            <button>Volver al historial</button>
          </Link>
          {attempt.status === "IN_PROGRESS" && (
            <Link to={`/quiz/run/${attempt.id}`}>
              <button className="primary">Continuar</button>
            </Link>
          )}
        </div>
      </section>

      <section className="card">
        <h3>Temas</h3>
        <ul>
          {attempt.resolvedTopicIds.map((id) => (
            <li key={id}>
              {topicName[id] ?? id}
              {attempt.topicScores?.[id] !== undefined ? ` — ${attempt.topicScores[id]}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Preguntas y respuestas</h3>
        <div className="stack">
          {attempt.questionIds.map((qid) => {
            const q = questionById[qid];
            if (!q) return null;
            const answer = attempt.answers[qid];
            let answerText = "—";
            if (answer?.type === "SINGLE_CHOICE") {
              answerText = q.options?.find((o) => o.id === answer.optionId)?.label ?? "—";
            } else if (answer?.type === "MULTIPLE_CHOICE") {
              answerText =
                q.options
                  ?.filter((o) => answer.optionIds.includes(o.id))
                  .map((o) => o.label)
                  .join("; ") || "—";
            } else if (answer?.type === "TEXT") {
              answerText = answer.text || "—";
            }
            const expected =
              q.type === "TEXT"
                ? q.referenceAnswer
                : q.options
                    ?.filter((o) => o.isCorrect)
                    .map((o) => o.label)
                    .join("; ");
            return (
              <div key={qid} className="card" style={{ boxShadow: "none" }}>
                <div className="row">
                  <strong>{q.prompt}</strong>
                  {attempt.questionScores?.[qid] !== undefined && (
                    <span className="badge band">{attempt.questionScores[qid]}</span>
                  )}
                </div>
                <p>
                  <span className="muted">Respuesta:</span> {answerText}
                </p>
                <p>
                  <span className="muted">Esperado:</span> {expected}
                </p>
                <p className="muted">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
