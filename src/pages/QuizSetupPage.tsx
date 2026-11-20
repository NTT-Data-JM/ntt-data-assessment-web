import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KNOWLEDGE_LEVELS } from "../domain/levels";
import type {
  DepthFocus,
  GenerationPreview,
  KnowledgeLevel,
  QuestionModeFilter,
  RoleBand,
  Topic,
} from "../domain/types";
import { useAsync } from "../hooks/useAsync";
import { getProfile, listTopics } from "../services/catalogService";
import { createAttempt, previewGeneration } from "../services/quizService";
import { useDemoStore } from "../state/DemoStore";

export function QuizSetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { roleBand: storeBand, revision } = useDemoStore();

  const [roleBand, setRoleBand] = useState<RoleBand>(
    (params.get("roleBand") as RoleBand) || storeBand,
  );
  const [mode, setMode] = useState<QuestionModeFilter>("BOTH");
  const [depthKind, setDepthKind] = useState<"RECOMMENDED" | "EXACT">("RECOMMENDED");
  const [exactDepths, setExactDepths] = useState<KnowledgeLevel[]>([
    "PRINCIPIANTE_AVANZADO",
    "COMPETENTE",
  ]);
  const [selected, setSelected] = useState<string[]>(
    () => params.get("topics")?.split(",").filter(Boolean) ?? [],
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const catalog = useAsync(async () => {
    const [profile, topics] = await Promise.all([
      getProfile(),
      listTopics({ search: search || undefined }),
    ]);
    return { profile, topics };
  }, [search, revision]);

  const setup = useMemo(() => {
    const depthFocus: DepthFocus =
      depthKind === "RECOMMENDED"
        ? { kind: "RECOMMENDED" }
        : { kind: "EXACT", depths: exactDepths };
    return {
      profileId: catalog.data?.profile.id ?? "",
      roleBand,
      depthFocus,
      questionMode: mode,
      selectedTopicIds: selected,
    };
  }, [catalog.data?.profile.id, roleBand, depthKind, exactDepths, mode, selected]);

  const previewState = useAsync(async (): Promise<GenerationPreview | null> => {
    if (!setup.profileId) return null;
    return previewGeneration(setup);
  }, [setup, revision]);

  useEffect(() => {
    const fromQuery = params.get("topics")?.split(",").filter(Boolean);
    if (fromQuery?.length) setSelected(fromQuery);
  }, [params]);

  function toggleTopic(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleDepth(level: KnowledgeLevel) {
    setExactDepths((prev) =>
      prev.includes(level) ? prev.filter((x) => x !== level) : [...prev, level],
    );
  }

  async function start() {
    try {
      setError("");
      setStarting(true);
      const attempt = await createAttempt(setup);
      navigate(`/quiz/run/${attempt.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el quiz");
    } finally {
      setStarting(false);
    }
  }

  const topics: Topic[] = catalog.data?.topics ?? [];
  const profile = catalog.data?.profile;
  const preview = previewState.data;

  if (catalog.loading && !catalog.data) return <p className="muted">Cargando setup…</p>;
  if (catalog.error || !profile) {
    return <div className="empty">No se pudo cargar el perfil: {catalog.error}</div>;
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Custom Quiz</h2>
        <p className="muted">
          Perfil activo: <strong>{profile.name}</strong>. Si no eliges temas, se auto-seleccionan 5.
        </p>
        <p className="muted">
          Multiple choice: solo puntúa 100 si el conjunto de opciones coincide exactamente.
        </p>

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <label className="field">
            <span>Role band</span>
            <select value={roleBand} onChange={(e) => setRoleBand(e.target.value as RoleBand)}>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </select>
          </label>
          <label className="field">
            <span>Modo de preguntas</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as QuestionModeFilter)}>
              <option value="CHOICE">Choice</option>
              <option value="TEXT">Text</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
          <label className="field">
            <span>Depth focus</span>
            <select
              value={depthKind}
              onChange={(e) => setDepthKind(e.target.value as "RECOMMENDED" | "EXACT")}
            >
              <option value="RECOMMENDED">Recommended (actual → COMPETENTE)</option>
              <option value="EXACT">Exact depths</option>
            </select>
          </label>
        </div>

        {depthKind === "EXACT" && (
          <div className="row" style={{ marginTop: "0.75rem" }}>
            {KNOWLEDGE_LEVELS.map((level) => (
              <label key={level} className="row">
                <input
                  type="checkbox"
                  checked={exactDepths.includes(level)}
                  onChange={() => toggleDepth(level)}
                />
                {level}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Temas seleccionados ({selected.length})</h3>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          {selected.map((id) => {
            const t = topics.find((x) => x.id === id);
            return (
              <button key={id} onClick={() => toggleTopic(id)}>
                {t?.name ?? id} ×
              </button>
            );
          })}
          {!selected.length && (
            <span className="muted">Vacío → auto 5 temas × 5 preguntas</span>
          )}
        </div>
        <label className="field">
          <span>Buscar y agregar temas</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SOLID, JUnit..."
          />
        </label>
        <div className="stack" style={{ marginTop: "0.75rem", maxHeight: 240, overflow: "auto" }}>
          {topics.map((t) => (
            <label key={t.id} className="row">
              <input
                type="checkbox"
                checked={selected.includes(t.id)}
                onChange={() => toggleTopic(t.id)}
              />
              <span>
                {t.name} {t.priorityToLevel ? "★" : ""}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Preview</h3>
        {previewState.loading && <p className="muted">Calculando preview…</p>}
        {previewState.error && <div className="warn-box">{previewState.error}</div>}
        {preview && (
          <>
            <p>
              Temas: <strong>{preview.topicIds.length}</strong> · Preguntas:{" "}
              <strong>{preview.totalQuestions}</strong> ({preview.questionsPerTopic}/tema)
            </p>
            {preview.substitutionsNote && (
              <div className="warn-box">{preview.substitutionsNote}</div>
            )}
            {preview.warnings.map((w) => (
              <div key={w} className="warn-box" style={{ marginTop: 8 }}>
                {w}
              </div>
            ))}
          </>
        )}
        {error && (
          <div className="warn-box" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}
        <div className="row" style={{ marginTop: "1rem" }}>
          <button
            className="primary"
            disabled={!preview?.valid || starting}
            onClick={() => void start()}
          >
            {starting ? "Creando…" : "Start quiz"}
          </button>
        </div>
      </section>
    </div>
  );
}
