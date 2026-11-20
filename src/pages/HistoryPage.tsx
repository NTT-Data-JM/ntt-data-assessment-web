import { useState } from "react";
import { Link } from "react-router-dom";
import { LevelBadge } from "../components/LevelBadge";
import { ScoreBar } from "../components/ScoreBar";
import { roleBandLabel } from "../domain/levels";
import type { QuestionModeFilter, RoleBand } from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { listTopics } from "../services/catalogService";
import { listAttempts, topicTrend } from "../services/historyService";
import { useDemoStore } from "../state/DemoStore";

export function HistoryPage() {
  const { revision } = useDemoStore();
  const [roleBand, setRoleBand] = useState<RoleBand | "">("");
  const [topicId, setTopicId] = useState("");
  const [mode, setMode] = useState<QuestionModeFilter | "">("");

  const { data, loading, error } = useAsync(async () => {
    const [attempts, allTopics, priorityTopics] = await Promise.all([
      listAttempts({
        roleBand: roleBand || undefined,
        topicId: topicId || undefined,
        mode: mode || undefined,
      }),
      listTopics(),
      listTopics({ priorityOnly: true }),
    ]);
    const trends = await Promise.all(
      priorityTopics.slice(0, 5).map(async (t) => ({
        topic: t,
        trend: await topicTrend(t.id),
      })),
    );
    return { attempts, allTopics, trends };
  }, [roleBand, topicId, mode, revision]);

  return (
    <div className="stack">
      <section className="card">
        <h2>Historial de quizzes</h2>
        <div className="filters">
          <label>
            Role band
            <select value={roleBand} onChange={(e) => setRoleBand(e.target.value as RoleBand | "")}>
              <option value="">Todas</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
          </label>
          <label>
            Tema
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">Todos</option>
              {(data?.allTopics ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modo
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as QuestionModeFilter | "")}
            >
              <option value="">Todos</option>
              <option value="CHOICE">Choice</option>
              <option value="TEXT">Text</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
        </div>
      </section>

      {loading && <p className="muted">Cargando historial…</p>}
      {error && <div className="empty">Error: {error}</div>}

      <section className="card">
        <h3>Tendencia de temas prioritarios</h3>
        <div className="stack">
          {(data?.trends ?? []).map(({ topic, trend }) => (
            <div key={topic.id}>
              <strong>{topic.name}</strong>
              <div className="row">
                {trend.length ? (
                  trend.map((x) => (
                    <span key={x.attemptId} className="badge band">
                      {x.score}
                    </span>
                  ))
                ) : (
                  <span className="muted">Sin historial</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Band</th>
              <th>Temas</th>
              <th>Score</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.attempts ?? []).map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{roleBandLabel(a.setup.roleBand)}</td>
                <td>{a.resolvedTopicIds.join(", ")}</td>
                <td>
                  {a.status === "COMPLETED" ? (
                    <div className="row">
                      <LevelBadge level={a.generalLevel ?? "N_A"} />
                      <ScoreBar score={a.generalScore ?? null} />
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{a.status}</td>
                <td>
                  <Link to={a.status === "COMPLETED" ? `/history/${a.id}` : `/quiz/run/${a.id}`}>
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data && !data.attempts.length && (
          <div className="empty">No hay intentos para estos filtros.</div>
        )}
      </section>
    </div>
  );
}
