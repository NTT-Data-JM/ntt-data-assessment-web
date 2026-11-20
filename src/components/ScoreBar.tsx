export function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="muted">Sin score</span>;
  return (
    <div className="row" style={{ width: "100%" }}>
      <strong style={{ minWidth: 36 }}>{score}</strong>
      <div className="score-bar" style={{ flex: 1 }}>
        <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}
