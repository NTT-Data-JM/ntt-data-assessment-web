import { Link, useParams } from "react-router-dom";
import { LevelBadge } from "../components/LevelBadge";
import { ScoreBar } from "../components/ScoreBar";
import type { Question, QuizAttempt } from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { getQuestionById, getTopic } from "../services/catalogService";
import { getAttempt } from "../services/historyService";
import { useDemoStore } from "../state/DemoStore";

export function QuizResultsPage() {
  const { attemptId = "" } = useParams();
  const { revision, roleBand } = useDemoStore();
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

  if (loading) return <p className="muted">Cargando resultados…</p>;
  if (error) return <div className="empty">Error: {error}</div>;
  if (!data?.attempt) return <div className="empty">Intento no encontrado.</div>;

  const { attempt, questions, topics } = data;
  if (attempt.status !== "COMPLETED") {
    return (
      <div className="empty">
        El intento sigue en progreso. <Link to={`/quiz/run/${attempt.id}`}>Continuar</Link>
      </div>
    );
  }

  const topicName = Object.fromEntries(topics.map((t) => [t.id, t.name]));
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const weakTopicIds = Object.entries(attempt.topicScores ?? {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([id]) => id);

  return (
    <div className="stack">
      <section className="card">
        <h2>Resultados del quiz</h2>
        <div className="row">
          <LevelBadge level={attempt.generalLevel ?? "N_A"} />
          <ScoreBar score={attempt.generalScore ?? null} />
        </div>
        <p className="muted">{attempt.overallNotes}</p>
        <div className="row" style={{ marginTop: "1rem" }}>
          <Link
            to={`/quiz/setup?topics=${attempt.resolvedTopicIds.join(",")}&roleBand=${attempt.setup.roleBand}`}
          >
            <button>Reintentar misma configuración</button>
          </Link>
          <Link to={`/quiz/setup?topics=${weakTopicIds.join(",")}&roleBand=${roleBand}`}>
            <button className="primary">Nuevo quiz desde temas débiles</button>
          </Link>
          <Link to="/dashboard">
            <button>Dashboard</button>
          </Link>
          <Link to={`/history/${attempt.id}`}>
            <button>Ver en history</button>
          </Link>
        </div>
      </section>

      <section className="card">
        <h3>Scores por tema</h3>
        <table>
          <thead>
            <tr>
              <th>Tema</th>
              <th>Score</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {attempt.resolvedTopicIds.map((id) => {
              const score = attempt.topicScores?.[id] ?? null;
              return (
                <tr key={id}>
                  <td>{topicName[id] ?? id}</td>
                  <td>
                    <ScoreBar score={score} />
                  </td>
                  <td className="muted">{attempt.topicNotes?.[id]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Revisión de respuestas</h3>
        <div className="stack">
          {attempt.questionIds.map((qid) => {
            const q = questionById[qid];
            if (!q) return null;
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
                  <span className="badge band">{attempt.questionScores?.[qid] ?? 0}</span>
                </div>
                <p>
                  <span className="muted">Tu respuesta:</span>{" "}
                  {formatAnswerLocal(attempt, q)}
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

function formatAnswerLocal(attempt: QuizAttempt, q: Question): string {
  const answer = attempt.answers[q.id];
  if (!answer) return "—";
  if (answer.type === "SINGLE_CHOICE") {
    return q.options?.find((o) => o.id === answer.optionId)?.label ?? "—";
  }
  if (answer.type === "MULTIPLE_CHOICE") {
    return (
      q.options
        ?.filter((o) => answer.optionIds.includes(o.id))
        .map((o) => o.label)
        .join("; ") || "—"
    );
  }
  return answer.text || "—";
}
