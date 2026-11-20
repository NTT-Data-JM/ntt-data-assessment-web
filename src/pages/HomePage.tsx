import { Link, useNavigate } from "react-router-dom";
import { LevelBadge } from "../components/LevelBadge";
import { GapBadge } from "../components/GapBadge";
import { useAsync } from "../hooks/useAsync";
import { getProfile } from "../services/catalogService";
import { getReadinessSummary } from "../services/progressService";
import { useDemoStore } from "../state/DemoStore";

export function HomePage() {
  const { revision, roleBand, refresh } = useDemoStore();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(
    async () => {
      const [profile, summary] = await Promise.all([getProfile(), getReadinessSummary()]);
      return { profile, summary };
    },
    [revision],
  );

  if (loading) return <p className="muted">Cargando readiness…</p>;
  if (error || !data) {
    return (
      <div className="card">
        <p>No se pudo cargar el backend: {error}</p>
        <button onClick={refresh}>Reintentar</button>
      </div>
    );
  }

  const { profile, summary } = data;

  return (
    <div className="stack">
      <section className="card">
        <h2>Readiness</h2>
        <p className="muted">
          Baseline <LevelBadge level={profile.baselineSeniority} /> → objetivo{" "}
          <LevelBadge level={profile.targetKnowledge} />
        </p>
        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <div>
            <h3>{summary.priorityPct}%</h3>
            <p className="muted">
              Temas prioritarios en COMPETENTE o superior ({summary.priorityAtTarget}/
              {summary.priorityTotal})
            </p>
          </div>
          <div>
            <h3>{summary.belowTargetCount}</h3>
            <p className="muted">Temas aún bajo COMPETENTE</p>
          </div>
        </div>
        <div className="row" style={{ marginTop: "1rem" }}>
          <button
            className="primary"
            onClick={() => {
              const ids = summary.weakTopics
                .filter((t) => t.priorityToLevel)
                .slice(0, 5)
                .map((t) => t.id);
              const q = new URLSearchParams();
              if (ids.length) q.set("topics", ids.join(","));
              q.set("roleBand", roleBand);
              navigate(`/quiz/setup?${q.toString()}`);
            }}
          >
            Iniciar quiz recomendado
          </button>
          <Link to="/dashboard">
            <button>Abrir dashboard</button>
          </Link>
          <button onClick={refresh}>Actualizar</button>
        </div>
      </section>

      <section className="card">
        <h2>Temas débiles ahora</h2>
        <div className="stack">
          {summary.weakTopics.map((t) => (
            <div key={t.id} className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{t.name}</strong>
                <div className="row" style={{ marginTop: 4 }}>
                  <LevelBadge level={t.currentLevel} />
                  <GapBadge level={t.currentLevel} />
                  {t.priorityToLevel && <span className="badge priority">Priority</span>}
                </div>
              </div>
              <Link to={`/quiz/setup?topics=${t.id}&roleBand=${roleBand}`}>
                <button className="primary">Practicar</button>
              </Link>
            </div>
          ))}
          {!summary.weakTopics.length && <p className="muted">Sin temas bajo COMPETENTE.</p>}
        </div>
      </section>
    </div>
  );
}
