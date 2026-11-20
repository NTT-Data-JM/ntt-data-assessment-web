import { Link } from "react-router-dom";
import { LevelBadge } from "../components/LevelBadge";
import { useAsync } from "../hooks/useAsync";
import { getBaselineBundle } from "../services/catalogService";
import { useDemoStore } from "../state/DemoStore";

export function BaselinePage() {
  const { revision, roleBand } = useDemoStore();
  const { data, loading, error } = useAsync(() => getBaselineBundle(), [revision]);

  if (loading) return <p className="muted">Cargando baseline…</p>;
  if (error || !data) return <div className="empty">No se pudo cargar: {error}</div>;

  const { profile, experiences, strengths, weaknesses, priorityTopics } = data;

  return (
    <div className="stack">
      <section className="card">
        <h2>Perfil baseline</h2>
        <p>
          <strong>{profile.candidateName}</strong>
        </p>
        <p className="muted">
          Rol {profile.roleFamily} · Tecnología {profile.technology} · Evaluación{" "}
          {profile.evaluationDate}
        </p>
        <div className="row">
          <span>Seniority:</span>
          <LevelBadge level={profile.baselineSeniority} />
          <span>Objetivo:</span>
          <LevelBadge level={profile.targetKnowledge} />
        </div>
      </section>

      <section className="card">
        <h2>Experiencia en dominios</h2>
        <table>
          <thead>
            <tr>
              <th>Experiencia</th>
              <th>Resultado Conocimiento</th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.knowledgeResult}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Temas a nivelar</h2>
        <div className="row">
          {priorityTopics.map((t) => (
            <Link key={t.id} to={`/topics/${t.id}`}>
              <span className="badge priority">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Fortalezas</h2>
          <div className="stack">
            {strengths.map((s) => (
              <div key={s.id}>
                <strong>{s.title}</strong>
                <p className="muted">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Debilidades</h2>
          <div className="stack">
            {weaknesses.map((w) => (
              <div key={w.id}>
                <strong>{w.title}</strong>
                <p className="muted">{w.description}</p>
                {w.relatedTopicIds?.length ? (
                  <Link
                    to={`/quiz/setup?topics=${w.relatedTopicIds.join(",")}&roleBand=${roleBand}`}
                  >
                    <button>Agregar temas relacionados al quiz</button>
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
