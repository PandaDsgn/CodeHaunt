import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function SubmissionsView() {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.allSubmissions().then(setSubmissions).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <h1>All submissions</h1>
      {error && <p className="error">{error}</p>}
      {submissions.length === 0 ? (
        <p className="empty-state">No submissions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Participant</th>
              <th>Question</th>
              <th>Language</th>
              <th>Status</th>
              <th>Public</th>
              <th>Private</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.submitted_at).toLocaleString()}</td>
                <td>{s.participant_name}</td>
                <td>{s.question_title}</td>
                <td>{s.language}</td>
                <td>
                  <span className={`badge badge-${s.status}`}>{s.status.replace("_", " ")}</span>
                </td>
                <td>
                  {s.public_pass_count}/{s.public_total}
                </td>
                <td>
                  {s.private_pass_count}/{s.private_total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
