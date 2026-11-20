import { NavLink, Outlet } from "react-router-dom";
import { useAsync } from "../hooks/useAsync";
import { getProfile } from "../services/catalogService";
import { useDemoStore } from "../state/DemoStore";
import { API_BASE_URL } from "../config";

export function AppShell() {
  const { roleBand, setRoleBand, leaderEnabled, revision, apiError } = useDemoStore();
  const { data: profile, loading, error } = useAsync(() => getProfile(), [revision]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">NTT Data Assessment</div>
          <div className="muted small">
            {loading && "Cargando perfil…"}
            {profile && (
              <>
                {profile.candidateName} · {profile.name} · API {API_BASE_URL}
              </>
            )}
            {(error || apiError) && (
              <span className="badge" style={{ color: "#b91c1c" }}>
                {error || apiError}
              </span>
            )}
          </div>
        </div>
        <label className="row">
          <span className="muted small">Role band</span>
          <select
            value={roleBand}
            onChange={(e) => setRoleBand(e.target.value as typeof roleBand)}
          >
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEADER" disabled={!leaderEnabled}>
              Leader
            </option>
          </select>
        </label>
      </header>

      <nav className="nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/baseline">Baseline</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/quiz/setup">Quiz</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/questions">Questions</NavLink>
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
