import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function SubmissionsView() {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.allSubmissions().then(setSubmissions).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page admin-page">
      <h1>All submissions</h1>
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <div className="panel-head">
          <h2>Submission log</h2>
          <span className="hint">{submissions.length} total</span>
        </div>
        {submissions.length === 0 ? (
          <p className="empty-state">No submissions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Participant</th>
                  <th>Question</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th className="num">Public</th>
                  <th className="num">Private</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="nowrap">{new Date(s.submitted_at).toLocaleString()}</td>
                    <td>{s.participant_name}</td>
                    <td>{s.question_title}</td>
                    <td>{s.language}</td>
                    <td>
                      <span className={`badge badge-${s.status}`}>{s.status.replace("_", " ")}</span>
                    </td>
                    <td className="num">
                      {s.public_pass_count}/{s.public_total}
                    </td>
                    <td className="num">
                      {s.private_pass_count}/{s.private_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
