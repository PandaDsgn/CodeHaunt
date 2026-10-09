import { useEffect, useState } from "react";
import { api } from "./api/client.js";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.leaderboard().then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <h1>Leaderboard</h1>
      {error && <p className="error">{error}</p>}
      {rows.length === 0 ? (
        <p className="empty-state">No scores yet. Be the first to haunt the board.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user_id} className={i < 3 ? `rank-${i + 1}` : undefined}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.total_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
