import { Link, useParams } from "react-router-dom";
import { GapBadge } from "../components/GapBadge";
import { LevelBadge } from "../components/LevelBadge";
import { ScoreBar } from "../components/ScoreBar";
import { roleBandLabel } from "../domain/levels";
import { useAsync } from "../hooks/useAsync";
import { getTopic, listCategories } from "../services/catalogService";
import { topicTrend } from "../services/historyService";
import { useDemoStore } from "../state/DemoStore";

export function TopicDetailPage() {
  const { topicId = "" } = useParams();
  const { revision, roleBand } = useDemoStore();
  const { data, loading, error } = useAsync(async () => {
    const [topic, categories, trends] = await Promise.all([
      getTopic(topicId),
      listCategories(),
      topicTrend(topicId),
    ]);
    return {
      topic,
      category: categories.find((c) => c.id === topic?.categoryId),
      trends,
    };
  }, [topicId, revision]);

  if (loading) return <p className="muted">Cargando tema…</p>;
  if (error) return <div className="empty">Error: {error}</div>;
  if (!data?.topic) return <div className="empty">Tema no encontrado.</div>;

  const { topic, category, trends } = data;

  return (
    <div className="stack">
      <section className="card">
        <p className="muted">{category?.name}</p>
        <h2>{topic.name}</h2>
        <div className="row">
          <span className="badge band">{roleBandLabel(topic.roleBand)}</span>
          {topic.priorityToLevel && <span className="badge priority">Priority</span>}
          <GapBadge level={topic.currentLevel} />
        </div>
        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <div>
            <h3>Baseline</h3>
            <LevelBadge level={topic.baselineLevel} />
            <p className="muted">{topic.baselineNotes}</p>
          </div>
          <div>
            <h3>Actual</h3>
            <div className="row">
              <LevelBadge level={topic.currentLevel} />
              <ScoreBar score={topic.currentScore} />
            </div>
            <p className="muted">{topic.generatedNotes || "Sin notas generadas aún."}</p>
          </div>
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          <Link to={`/quiz/setup?topics=${topic.id}&roleBand=${roleBand}`}>
            <button className="primary">Practicar este tema</button>
          </Link>
          <Link to="/dashboard">
            <button>Volver al dashboard</button>
          </Link>
        </div>
      </section>

      <section className="card">
        <h3>Intentos recientes</h3>
        {trends.length ? (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => (
                <tr key={t.attemptId}>
                  <td>{new Date(t.date).toLocaleString()}</td>
                  <td>{t.score}</td>
                  <td>
                    <Link to={`/history/${t.attemptId}`}>Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">Aún no hay intentos para este tema.</div>
        )}
      </section>
    </div>
  );
}
