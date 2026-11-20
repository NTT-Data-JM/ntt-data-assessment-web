import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GapBadge } from "../components/GapBadge";
import { LevelBadge } from "../components/LevelBadge";
import { ScoreBar } from "../components/ScoreBar";
import { roleBandLabel } from "../domain/levels";
import type { RoleBand } from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { listCategories, listTopics } from "../services/catalogService";
import { getCategoryScores } from "../services/progressService";
import { useDemoStore } from "../state/DemoStore";

export function DashboardPage() {
  const { revision } = useDemoStore();
  const [params, setParams] = useSearchParams();

  const [categoryId, setCategoryId] = useState(params.get("category") ?? "");
  const [roleBand, setRoleBand] = useState<RoleBand | "">(
    (params.get("roleBand") as RoleBand) || "",
  );
  const [priorityOnly, setPriorityOnly] = useState(params.get("priorityOnly") === "1");
  const [belowTarget, setBelowTarget] = useState(params.get("belowTarget") === "1");
  const [coreOnly, setCoreOnly] = useState(params.get("coreOnly") === "1");

  const { data, loading, error } = useAsync(async () => {
    const [categories, categoryScores] = await Promise.all([
      listCategories(),
      getCategoryScores(),
    ]);
    const blocks = await Promise.all(
      categoryScores.map(async (c) => ({
        ...c,
        topics: await listTopics({
          categoryId: c.category.id,
          roleBand: roleBand || undefined,
          priorityOnly: priorityOnly || undefined,
          belowTargetOnly: belowTarget || undefined,
          coreOnly: coreOnly || undefined,
        }),
      })),
    );
    return {
      categories,
      scores: blocks.filter(
        (c) => (!categoryId || c.category.id === categoryId) && c.topics.length > 0,
      ),
    };
  }, [categoryId, roleBand, priorityOnly, belowTarget, coreOnly, revision]);

  function syncParams(next: {
    categoryId: string;
    roleBand: RoleBand | "";
    priorityOnly: boolean;
    belowTarget: boolean;
    coreOnly: boolean;
  }) {
    const p = new URLSearchParams();
    if (next.categoryId) p.set("category", next.categoryId);
    if (next.roleBand) p.set("roleBand", next.roleBand);
    if (next.priorityOnly) p.set("priorityOnly", "1");
    if (next.belowTarget) p.set("belowTarget", "1");
    if (next.coreOnly) p.set("coreOnly", "1");
    setParams(p);
  }

  const categories = data?.categories ?? [];
  const scores = data?.scores ?? [];

  return (
    <div className="stack">
      <section className="card">
        <h2>Dashboard de scores actuales</h2>
        <div className="filters">
          <label>
            Categoría
            <select
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value;
                setCategoryId(v);
                syncParams({ categoryId: v, roleBand, priorityOnly, belowTarget, coreOnly });
              }}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role band
            <select
              value={roleBand}
              onChange={(e) => {
                const v = e.target.value as RoleBand | "";
                setRoleBand(v);
                syncParams({ categoryId, roleBand: v, priorityOnly, belowTarget, coreOnly });
              }}
            >
              <option value="">Todas</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
          </label>
          <label>
            <span>Priority only</span>
            <input
              type="checkbox"
              checked={priorityOnly}
              onChange={(e) => {
                setPriorityOnly(e.target.checked);
                syncParams({
                  categoryId,
                  roleBand,
                  priorityOnly: e.target.checked,
                  belowTarget,
                  coreOnly,
                });
              }}
            />
          </label>
          <label>
            <span>Below COMPETENTE</span>
            <input
              type="checkbox"
              checked={belowTarget}
              onChange={(e) => {
                setBelowTarget(e.target.checked);
                syncParams({
                  categoryId,
                  roleBand,
                  priorityOnly,
                  belowTarget: e.target.checked,
                  coreOnly,
                });
              }}
            />
          </label>
          <label>
            <span>Core only</span>
            <input
              type="checkbox"
              checked={coreOnly}
              onChange={(e) => {
                setCoreOnly(e.target.checked);
                syncParams({
                  categoryId,
                  roleBand,
                  priorityOnly,
                  belowTarget,
                  coreOnly: e.target.checked,
                });
              }}
            />
          </label>
        </div>
      </section>

      {loading && <p className="muted">Cargando dashboard…</p>}
      {error && <div className="empty">Error: {error}</div>}

      {scores.map((block) => (
        <section className="card" key={block.category.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>{block.category.name}</h3>
            <div className="row">
              <LevelBadge level={block.level} />
              <ScoreBar score={block.score} />
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tema</th>
                <th>Band</th>
                <th>Baseline</th>
                <th>Actual</th>
                <th>Gap</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {block.topics.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/topics/${t.id}`}>{t.name}</Link>{" "}
                    {t.priorityToLevel && <span className="badge priority">Priority</span>}
                  </td>
                  <td>{roleBandLabel(t.roleBand)}</td>
                  <td>
                    <LevelBadge level={t.baselineLevel} />
                  </td>
                  <td>
                    <LevelBadge level={t.currentLevel} />
                  </td>
                  <td>
                    <GapBadge level={t.currentLevel} />
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <ScoreBar score={t.currentScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {!loading && !error && !scores.length && (
        <div className="empty">No hay temas para los filtros actuales.</div>
      )}
    </div>
  );
}
