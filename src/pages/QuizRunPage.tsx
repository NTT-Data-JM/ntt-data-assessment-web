import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { levelLabel, roleBandLabel } from "../domain/levels";
import type { AnswerValue, Question, QuizAttempt } from "../domain/types";
import { getProfile, getQuestionById } from "../services/catalogService";
import { getAttempt } from "../services/historyService";
import { saveAnswer, submitAttempt } from "../services/quizService";
import { useDemoStore } from "../state/DemoStore";

export function QuizRunPage() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const { refresh } = useDemoStore();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [a, profile] = await Promise.all([getAttempt(attemptId), getProfile()]);
        if (cancelled) return;
        if (!a) {
          setAttempt(null);
          setQuestions([]);
          return;
        }
        const qs = (
          await Promise.all(a.questionIds.map((id) => getQuestionById(id)))
        ).filter((q): q is Question => Boolean(q));
        if (cancelled) return;
        setAttempt(a);
        setQuestions(qs);
        setProfileName(profile.name);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (loading) return <p className="muted">Cargando intento…</p>;
  if (error) return <div className="empty">Error: {error}</div>;
  if (!attempt) {
    return (
      <div className="empty">
        Intento no encontrado. <Link to="/quiz/setup">Crear quiz</Link>
      </div>
    );
  }
  if (attempt.status === "COMPLETED") {
    return <Navigate to={`/quiz/results/${attempt.id}`} replace />;
  }

  const question = questions[index];
  const answered = attempt.questionIds.filter((id) => attempt.answers[id]).length;
  const currentAnswer = question ? attempt.answers[question.id] : undefined;

  async function persist(answer: AnswerValue) {
    if (!question || !attempt) return;
    setSaving(true);
    try {
      const updated = await saveAnswer(attemptId, question.id, answer);
      setAttempt(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    if (!attempt) return;
    const unanswered = attempt.questionIds.filter((id) => !attempt.answers[id]);
    if (unanswered.length) {
      const ok = confirm(
        `Quedan ${unanswered.length} preguntas sin responder. Se puntuarán con 0. ¿Enviar igual?`,
      );
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const completed = await submitAttempt(attemptId, true);
      refresh();
      navigate(`/quiz/results/${completed.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  if (!question) return <div className="empty">No hay preguntas en este intento.</div>;

  return (
    <div className="stack">
      <section className="card row" style={{ justifyContent: "space-between" }}>
        <div>
          <strong>{profileName}</strong> · {roleBandLabel(attempt.setup.roleBand)} ·{" "}
          {attempt.setup.questionMode}
          {saving && <span className="muted"> · Guardando…</span>}
        </div>
        <div>
          Progreso: {answered}/{attempt.questionIds.length} · Pregunta {index + 1}/
          {questions.length}
        </div>
      </section>

      <section className="card question-card">
        <div className="row">
          <span className="badge band">{question.type}</span>
          <span className={`badge level-${question.knowledgeDepth}`}>
            {levelLabel(question.knowledgeDepth)}
          </span>
        </div>
        <h2 style={{ fontSize: "1.15rem" }}>{question.prompt}</h2>

        {question.type === "SINGLE_CHOICE" && (
          <div className="option-list">
            {question.options?.map((opt) => (
              <label key={opt.id}>
                <input
                  type="radio"
                  name={question.id}
                  checked={
                    currentAnswer?.type === "SINGLE_CHOICE" && currentAnswer.optionId === opt.id
                  }
                  onChange={() => void persist({ type: "SINGLE_CHOICE", optionId: opt.id })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "MULTIPLE_CHOICE" && (
          <div className="option-list">
            {question.options?.map((opt) => {
              const selected =
                currentAnswer?.type === "MULTIPLE_CHOICE" ? currentAnswer.optionIds : [];
              return (
                <label key={opt.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.id)}
                    onChange={() => {
                      const next = selected.includes(opt.id)
                        ? selected.filter((x) => x !== opt.id)
                        : [...selected, opt.id];
                      void persist({ type: "MULTIPLE_CHOICE", optionIds: next });
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "TEXT" && (
          <textarea
            rows={5}
            value={currentAnswer?.type === "TEXT" ? currentAnswer.text : ""}
            onChange={(e) => void persist({ type: "TEXT", text: e.target.value })}
            placeholder="Escribe tu respuesta..."
          />
        )}

        <div className="row" style={{ justifyContent: "space-between" }}>
          <button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Anterior
          </button>
          <div className="row">
            {index < questions.length - 1 ? (
              <button className="primary" onClick={() => setIndex((i) => i + 1)}>
                Siguiente
              </button>
            ) : (
              <button
                className="primary"
                disabled={submitting}
                onClick={() => void onSubmit()}
              >
                {submitting ? "Enviando…" : "Enviar quiz"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
